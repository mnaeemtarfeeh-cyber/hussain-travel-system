import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [bookingCounts, income, expense, upcoming] = await Promise.all([
      prisma.booking.groupBy({ by: ["status"], _count: true }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: startOfMonth } } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: startOfMonth } } }),
      prisma.booking.findMany({
        where: { status: { in: ["PENDING", "CONFIRMED"] }, pickupDate: { gte: new Date() } },
        include: { customer: true },
        orderBy: { pickupDate: "asc" },
        take: 5,
      }),
    ]);

    const bookingsByStatus = Object.fromEntries(
      bookingCounts.map((b) => [b.status, b._count]),
    );

    res.json({
      bookingsByStatus,
      incomeThisMonth: Number(income._sum.amount ?? 0),
      expenseThisMonth: Number(expense._sum.amount ?? 0),
      upcomingBookings: upcoming,
    });
  }),
);
