import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";

export const driversRouter = Router();
driversRouter.use(requireAuth);

const driverSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  licenseNumber: z.string().min(1),
  licenseExpiry: z.string().datetime().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

function toData(data: z.infer<typeof driverSchema>) {
  return {
    ...data,
    licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : undefined,
  };
}

driversRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const drivers = await prisma.driver.findMany({
      where: status ? { status: status as "ACTIVE" | "INACTIVE" } : {},
      orderBy: { createdAt: "desc" },
    });
    res.json(drivers);
  }),
);

driversRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const driver = await prisma.driver.findUnique({
      where: { id: (req.params.id as string) },
      include: { bookings: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json(driver);
  }),
);

driversRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = driverSchema.parse(req.body);
    const driver = await prisma.driver.create({ data: toData(data) });
    res.status(201).json(driver);
  }),
);

driversRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = driverSchema.partial().parse(req.body);
    const driver = await prisma.driver.update({ where: { id: (req.params.id as string) }, data: toData(data as z.infer<typeof driverSchema>) });
    res.json(driver);
  }),
);

driversRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.driver.delete({ where: { id: (req.params.id as string) } });
    res.status(204).end();
  }),
);
