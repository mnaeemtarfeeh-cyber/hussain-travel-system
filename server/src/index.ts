import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { customersRouter } from "./routes/customers";
import { vehiclesRouter } from "./routes/vehicles";
import { driversRouter } from "./routes/drivers";
import { bookingsRouter } from "./routes/bookings";
import { invoicesRouter } from "./routes/invoices";
import { paymentsRouter } from "./routes/payments";
import { expensesRouter } from "./routes/expenses";
import { dashboardRouter } from "./routes/dashboard";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/customers", customersRouter);
app.use("/api/vehicles", vehiclesRouter);
app.use("/api/drivers", driversRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/dashboard", dashboardRouter);

app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "Validation failed", details: err.issues });
    }
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "Internal server error";
    if (status === 500) console.error(err);
    res.status(status).json({ error: message });
  },
);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
