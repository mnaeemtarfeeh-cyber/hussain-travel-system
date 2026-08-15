import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute, RequireRole } from "@/components/layout/ProtectedRoute";
import Login from "@/pages/Login";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Customers = lazy(() => import("@/pages/Customers"));
const CustomerDetail = lazy(() => import("@/pages/CustomerDetail"));
const Bookings = lazy(() => import("@/pages/Bookings"));
const BookingDetail = lazy(() => import("@/pages/BookingDetail"));
const Invoices = lazy(() => import("@/pages/Invoices"));
const Finance = lazy(() => import("@/pages/Finance"));
const Drivers = lazy(() => import("@/pages/Drivers"));
const Fleet = lazy(() => import("@/pages/Fleet"));
const Users = lazy(() => import("@/pages/Users"));

function PageFallback() {
  return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
}

function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/bookings/:id" element={<BookingDetail />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route element={<RequireRole roles={["ADMIN", "ACCOUNTANT"]} />}>
              <Route path="/finance" element={<Finance />} />
            </Route>
            <Route element={<RequireRole roles={["ADMIN"]} />}>
              <Route path="/users" element={<Users />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
