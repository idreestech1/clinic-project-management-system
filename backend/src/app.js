import cors from "cors";
import express from "express";
import appointmentsRouter from "./routes/appointments.routes.js";
import authRouter from "./routes/auth.routes.js";
import contactRouter from "./routes/contact.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import doctorsRouter from "./routes/doctors.routes.js";
import galleryRouter from "./routes/gallery.routes.js";
import patientsRouter from "./routes/patients.routes.js";
import reviewsRouter from "./routes/reviews.routes.js";
import servicesRouter from "./routes/services.routes.js";
import settingsRouter from "./routes/settings.routes.js";
import slotsRouter from "./routes/slots.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

const configuredOrigins = [
  process.env.CLIENT_ORIGIN,
  process.env.FRONTEND_URL,
  process.env.FRONTEND_ORIGIN,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]
  .join(",")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLoopbackOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return ["localhost", "127.0.0.1", "::1"].includes(hostname);
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (
        configuredOrigins.includes(origin) ||
        (process.env.NODE_ENV !== "production" && isLoopbackOrigin(origin))
      ) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "doctor-backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/appointments", appointmentsRouter);
app.use("/api/auth", authRouter);
app.use("/api/contact", contactRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/doctors", doctorsRouter);
app.use("/api/gallery", galleryRouter);
app.use("/api/patients", patientsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/services", servicesRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/slots", slotsRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

export default app;
