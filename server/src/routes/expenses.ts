import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";

export const expensesRouter = Router();
expensesRouter.use(requireAuth);

const expenseSchema = z.object({
  category: z.enum(["FUEL", "MAINTENANCE", "SALARY", "OTHER"]),
  amount: z.number().positive(),
  date: z.string().datetime().optional(),
  vehicleId: z.string().optional().or(z.literal("")),
  driverId: z.string().optional().or(z.literal("")),
  description: z.string().min(1),
});

expensesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const category = req.query.category as string | undefined;
    const expenses = await prisma.expense.findMany({
      where: {
        date: from || to ? { gte: from, lte: to } : undefined,
        category: category as "FUEL" | "MAINTENANCE" | "SALARY" | "OTHER" | undefined,
      },
      include: { vehicle: true, driver: true },
      orderBy: { date: "desc" },
    });
    res.json(expenses);
  }),
);

expensesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = expenseSchema.parse(req.body);
    const expense = await prisma.expense.create({
      data: {
        category: data.category,
        amount: data.amount,
        date: data.date ? new Date(data.date) : undefined,
        vehicleId: data.vehicleId || null,
        driverId: data.driverId || null,
        description: data.description,
        recordedById: req.user!.userId,
      },
    });
    res.status(201).json(expense);
  }),
);

expensesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.expense.delete({ where: { id: (req.params.id as string) } });
    res.status(204).end();
  }),
);
