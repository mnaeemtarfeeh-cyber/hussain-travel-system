import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";

export const customersRouter = Router();
customersRouter.use(requireAuth);

const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  passportId: z.string().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

customersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize) || 20);
    const search = String(req.query.search ?? "").trim();

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { passportId: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { bookings: true } } },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({ items, total, page, pageSize });
  }),
);

customersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id as string },
      include: {
        bookings: {
          orderBy: { pickupDate: "desc" },
          include: { driver: true, vehicle: true, invoice: { include: { payments: true } } },
        },
      },
    });
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const totalBookings = customer.bookings.length;
    const completedBookings = customer.bookings.filter((b) => b.status === "COMPLETED").length;
    const totalSpent = customer.bookings.reduce((sum, b) => {
      const paid = (b.invoice?.payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
      return sum + paid;
    }, 0);
    const lastBooking = customer.bookings[0] ?? null;

    res.json({
      ...customer,
      stats: { totalBookings, completedBookings, totalSpent, lastBookingAt: lastBooking?.pickupDate ?? null },
    });
  }),
);

customersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = customerSchema.parse(req.body);
    const customer = await prisma.customer.create({
      data: { ...data, phone: data.phone || "", email: data.email || null },
    });
    res.status(201).json(customer);
  }),
);

customersRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = customerSchema.partial().parse(req.body);
    const customer = await prisma.customer.update({
      where: { id: req.params.id as string },
      data: { ...data, email: data.email === "" ? null : data.email },
    });
    res.json(customer);
  }),
);

customersRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.customer.delete({ where: { id: req.params.id as string } });
    res.status(204).end();
  }),
);
