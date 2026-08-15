import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);

const createSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  method: z.string().min(1),
  paidAt: z.string().datetime().optional(),
});

paymentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const payments = await prisma.payment.findMany({
      where: {
        paidAt: from || to ? { gte: from, lte: to } : undefined,
      },
      include: { invoice: { include: { customer: true } } },
      orderBy: { paidAt: "desc" },
    });
    res.json(payments);
  }),
);

paymentsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: data.invoiceId },
        include: { payments: true },
      });
      if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });

      const payment = await tx.payment.create({
        data: {
          invoiceId: data.invoiceId,
          amount: data.amount,
          method: data.method,
          paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
          recordedById: req.user!.userId,
        },
      });

      const totalPaid =
        invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0) + data.amount;
      const newStatus =
        totalPaid >= Number(invoice.total) ? "PAID" : totalPaid > 0 ? "PARTIAL" : "UNPAID";

      await tx.invoice.update({ where: { id: data.invoiceId }, data: { status: newStatus } });

      return payment;
    });

    res.status(201).json(result);
  }),
);
