import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";

export const customersRouter = Router();
customersRouter.use(requireAuth);

const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
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
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
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
      include: { bookings: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  }),
);

customersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = customerSchema.parse(req.body);
    const customer = await prisma.customer.create({ data: { ...data, email: data.email || null } });
    res.status(201).json(customer);
  }),
);

customersRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = customerSchema.partial().parse(req.body);
    const customer = await prisma.customer.update({
      where: { id: (req.params.id as string) },
      data: { ...data, email: data.email === "" ? null : data.email },
    });
    res.json(customer);
  }),
);

customersRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.customer.delete({ where: { id: (req.params.id as string) } });
    res.status(204).end();
  }),
);
