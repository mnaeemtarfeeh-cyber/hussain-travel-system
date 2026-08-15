import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";

export const invoicesRouter = Router();
invoicesRouter.use(requireAuth);

const createSchema = z.object({
  bookingId: z.string().min(1),
  tax: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  dueDate: z.string().datetime().optional(),
});

async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { invoiceNumber: { startsWith: `INV-${year}-` } },
  });
  return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
}

invoicesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const invoices = await prisma.invoice.findMany({
      where: status ? { status: status as "UNPAID" | "PARTIAL" | "PAID" } : {},
      include: { customer: true, booking: true, payments: true },
      orderBy: { issueDate: "desc" },
    });
    res.json(invoices);
  }),
);

invoicesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findUnique({
      where: { id: (req.params.id as string) },
      include: { customer: true, booking: true, payments: { orderBy: { paidAt: "desc" } } },
    });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  }),
);

invoicesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const booking = await prisma.booking.findUnique({ where: { id: data.bookingId } });
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const subtotal = Number(booking.fare);
    const total = subtotal + data.tax - data.discount;
    const invoiceNumber = await nextInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        bookingId: data.bookingId,
        customerId: booking.customerId,
        subtotal,
        tax: data.tax,
        discount: data.discount,
        total,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: { customer: true, booking: true, payments: true },
    });
    res.status(201).json(invoice);
  }),
);

invoicesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.invoice.delete({ where: { id: (req.params.id as string) } });
    res.status(204).end();
  }),
);
