import { Badge } from "@/components/ui/badge";
import type { BookingStatus, InvoiceStatus, VehicleStatus, DriverStatus } from "@/lib/types";

const TONES: Record<string, "success" | "warning" | "destructive" | "muted" | "default"> = {
  PENDING: "warning",
  CONFIRMED: "default",
  COMPLETED: "success",
  CANCELLED: "destructive",
  UNPAID: "destructive",
  PARTIAL: "warning",
  PAID: "success",
  ACTIVE: "success",
  MAINTENANCE: "warning",
  INACTIVE: "muted",
};

export function StatusBadge({
  status,
}: {
  status: BookingStatus | InvoiceStatus | VehicleStatus | DriverStatus;
}) {
  return <Badge tone={TONES[status] ?? "muted"}>{status}</Badge>;
}
