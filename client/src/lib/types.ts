export type Role = "ADMIN" | "AGENT" | "ACCOUNTANT";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
};

export type VehicleStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";
export type Vehicle = {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  status: VehicleStatus;
  insuranceExpiry?: string | null;
  registrationExpiry?: string | null;
  createdAt: string;
};

export type DriverStatus = "ACTIVE" | "INACTIVE";
export type Driver = {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry?: string | null;
  status: DriverStatus;
  createdAt: string;
};

export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type Booking = {
  id: string;
  bookingNumber: string;
  customerId: string;
  driverId?: string | null;
  vehicleId?: string | null;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  status: BookingStatus;
  fare: string | number;
  notes?: string | null;
  createdAt: string;
  customer?: Customer;
  driver?: Driver | null;
  vehicle?: Vehicle | null;
  invoice?: Invoice | null;
};

export type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID";
export type Invoice = {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  customerId: string;
  subtotal: string | number;
  tax: string | number;
  discount: string | number;
  total: string | number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string | null;
  customer?: Customer;
  booking?: Booking;
  payments?: Payment[];
};

export type Payment = {
  id: string;
  invoiceId: string;
  amount: string | number;
  method: string;
  paidAt: string;
  invoice?: Invoice;
};

export type ExpenseCategory = "FUEL" | "MAINTENANCE" | "SALARY" | "OTHER";
export type Expense = {
  id: string;
  category: ExpenseCategory;
  amount: string | number;
  date: string;
  vehicleId?: string | null;
  driverId?: string | null;
  description: string;
  vehicle?: Vehicle | null;
  driver?: Driver | null;
};

export type DashboardSummary = {
  bookingsByStatus: Partial<Record<BookingStatus, number>>;
  incomeThisMonth: number;
  expenseThisMonth: number;
  upcomingBookings: Booking[];
};

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
};
