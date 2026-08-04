import crypto from "node:crypto";
import {
  createAppointmentRecord,
  isAppointmentBooked,
  readAppointments,
  updateAppointmentRecord,
} from "../services/appointmentStore.js";
import { assertBookableDate, isAllowedSlot } from "../utils/slots.js";

const requiredFields = ["name", "phone", "email", "date", "time"];

const validateAppointment = (body) => {
  const missing = requiredFields.filter((field) => !String(body[field] || "").trim());

  if (missing.length) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  if (!/^\S+@\S+\.\S+$/.test(body.email)) {
    const error = new Error("Enter a valid email address.");
    error.statusCode = 400;
    throw error;
  }

  assertBookableDate(body.date);

  if (!isAllowedSlot(body.time)) {
    const error = new Error("Selected time slot is not available.");
    error.statusCode = 400;
    throw error;
  }
};

const validateAppointmentUpdate = (body) => {
  const updates = {};

  if (body.status !== undefined) {
    if (!["confirmed", "completed", "cancelled"].includes(body.status)) {
      const error = new Error("Appointment status must be confirmed, completed, or cancelled.");
      error.statusCode = 400;
      throw error;
    }

    updates.status = body.status;
  }

  if (body.feeAmount !== undefined) {
    const feeAmount = Number(body.feeAmount);

    if (!Number.isFinite(feeAmount) || feeAmount < 0) {
      const error = new Error("Fee amount must be a valid positive number.");
      error.statusCode = 400;
      throw error;
    }

    updates.feeAmount = feeAmount;
  }

  if (body.paymentStatus !== undefined) {
    if (!["unpaid", "paid"].includes(body.paymentStatus)) {
      const error = new Error("Payment status must be paid or unpaid.");
      error.statusCode = 400;
      throw error;
    }

    updates.paymentStatus = body.paymentStatus;
    updates.paidAt = body.paymentStatus === "paid" ? new Date() : null;
  }

  return updates;
};

export const getAppointments = async (_req, res, next) => {
  try {
    const appointments = await readAppointments();
    res.json({ appointments });
  } catch (err) {
    next(err);
  }
};

export const createAppointment = async (req, res, next) => {
  try {
    validateAppointment(req.body);

    const alreadyBooked = await isAppointmentBooked(req.body.date, req.body.time);

    if (alreadyBooked) {
      const error = new Error("This time slot is already booked.");
      error.statusCode = 409;
      throw error;
    }

    const appointment = {
      id: crypto.randomUUID(),
      name: req.body.name.trim(),
      phone: req.body.phone.trim(),
      email: req.body.email.trim().toLowerCase(),
      notes: String(req.body.notes || "").trim(),
      date: req.body.date,
      time: req.body.time,
      status: "confirmed",
      feeAmount: Number(req.body.feeAmount) || 1000,
      paymentStatus: "unpaid",
      paidAt: null,
      createdAt: new Date().toISOString(),
    };

    const createdAppointment = await createAppointmentRecord(appointment);

    res.status(201).json({ appointment: createdAppointment });
  } catch (err) {
    if (err.code === 11000) {
      err.message = "This time slot is already booked.";
      err.statusCode = 409;
    }

    next(err);
  }
};

export const updateAppointment = async (req, res, next) => {
  try {
    const updates = validateAppointmentUpdate(req.body);
    const appointment = await updateAppointmentRecord(req.params.id, updates);

    if (!appointment) {
      res.status(404).json({ message: "Appointment not found." });
      return;
    }

    res.json({ appointment });
  } catch (err) {
    next(err);
  }
};
