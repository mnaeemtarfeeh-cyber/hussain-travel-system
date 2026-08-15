import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";

export const bookingsRouter = Router();
bookingsRouter.use(requireAuth);

const bookingSchema = z.object({
  customerId: z.string().min(1),
  driverId: z.string().optional().or(z.literal("")),
  vehicleId: z.string().optional().or(z.literal("")),
  pickupLocation: z.string().min(1),
  dropoffLocation: z.string().min(1),
  pickupDate: z.string().datetime(),
  passengers: z.number().int().positive().optional(),
  fare: z.number().nonnegative(),
  notes: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]),
});

async function nextBookingNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.booking.count({
    where: { bookingNumber: { startsWith: `BK-${year}-` } },
  });
  return `BK-${year}-${String(count + 1).padStart(4, "0")}`;
}

bookingsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const driverId = req.query.driverId as string | undefined;
    const vehicleId = req.query.vehicleId as string | undefined;
    const customerId = req.query.customerId as string | undefined;
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;

    const bookings = await prisma.booking.findMany({
      where: {
        status: status ? (status as "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED") : undefined,
        driverId: driverId || undefined,
        vehicleId: vehicleId || undefined,
        customerId: customerId || undefined,
        pickupDate: from || to ? { gte: from, lte: to } : undefined,
      },
      include: { customer: true, driver: true, vehicle: true, invoice: true },
      orderBy: { pickupDate: "desc" },
    });
    res.json(bookings);
  }),
);

bookingsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id as string },
      include: {
        customer: true,
        driver: true,
        vehicle: true,
        createdBy: { select: { id: true, name: true } },
        invoice: { include: { payments: { orderBy: { paidAt: "desc" } } } },
      },
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
  }),
);

bookingsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = bookingSchema.parse(req.body);
    const bookingNumber = await nextBookingNumber();
    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        customerId: data.customerId,
        driverId: data.driverId || null,
        vehicleId: data.vehicleId || null,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        pickupDate: new Date(data.pickupDate),
        passengers: data.passengers ?? 1,
        fare: data.fare,
        notes: data.notes,
        createdById: req.user!.userId,
      },
      include: { customer: true, driver: true, vehicle: true },
    });
    res.status(201).json(booking);
  }),
);

bookingsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = bookingSchema.partial().parse(req.body);
    const booking = await prisma.booking.update({
      where: { id: req.params.id as string },
      data: {
        ...data,
        driverId: data.driverId === "" ? null : data.driverId,
        vehicleId: data.vehicleId === "" ? null : data.vehicleId,
        pickupDate: data.pickupDate ? new Date(data.pickupDate) : undefined,
      },
      include: { customer: true, driver: true, vehicle: true },
    });
    res.json(booking);
  }),
);

bookingsRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const { status } = statusSchema.parse(req.body);
    const booking = await prisma.booking.update({
      where: { id: req.params.id as string },
      data: { status },
      include: { customer: true, driver: true, vehicle: true },
    });
    res.json(booking);
  }),
);

bookingsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.booking.delete({ where: { id: req.params.id as string } });
    res.status(204).end();
  }),
);
