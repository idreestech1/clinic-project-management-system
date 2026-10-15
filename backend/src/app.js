import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
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
import { connectDatabase } from "./config/database.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Database connection wrapper middleware: ensures MongoDB is connected before handling queries
app.use(async (req, res, next) => {
  // Allow health check to respond immediately without blocking
  if (req.path === "/api/health") {
    return next();
  }

  try {
    await connectDatabase();
    next();
  } catch (err) {
    console.error("Database connection failed in request wrapper:", err.message);
    return res.status(503).json({
      ok: false,
      message: "Database connection failed or timed out. Please verify MongoDB status.",
      error: err.message,
    });
  }
});

app.get("/api/health", (_req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    ok: true,
    service: "doctor-backend",
    database: isConnected ? "connected" : "disconnected",
    databaseName: mongoose.connection.name || null,
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

// Serverless handler wrapper (supports Vercel, serverless, or microservice environments)
export const handler = async (req, res) => {
  await connectDatabase();
  return app(req, res);
};

export default app;
