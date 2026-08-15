import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";

export const vehiclesRouter = Router();
vehiclesRouter.use(requireAuth);

const vehicleSchema = z.object({
  plateNumber: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int(),
  capacity: z.number().int().positive(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]).optional(),
  insuranceExpiry: z.string().datetime().optional().or(z.literal("")),
  registrationExpiry: z.string().datetime().optional().or(z.literal("")),
});

function toData(data: z.infer<typeof vehicleSchema>) {
  return {
    ...data,
    insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : undefined,
    registrationExpiry: data.registrationExpiry ? new Date(data.registrationExpiry) : undefined,
  };
}

vehiclesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const vehicles = await prisma.vehicle.findMany({
      where: status ? { status: status as "ACTIVE" | "MAINTENANCE" | "INACTIVE" } : {},
      orderBy: { createdAt: "desc" },
    });
    res.json(vehicles);
  }),
);

vehiclesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: (req.params.id as string) },
      include: { bookings: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    res.json(vehicle);
  }),
);

vehiclesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = vehicleSchema.parse(req.body);
    const vehicle = await prisma.vehicle.create({ data: toData(data) });
    res.status(201).json(vehicle);
  }),
);

vehiclesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = vehicleSchema.partial().parse(req.body);
    const vehicle = await prisma.vehicle.update({ where: { id: (req.params.id as string) }, data: toData(data as z.infer<typeof vehicleSchema>) });
    res.json(vehicle);
  }),
);

vehiclesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.vehicle.delete({ where: { id: (req.params.id as string) } });
    res.status(204).end();
  }),
);
