import { Appointment } from "../models/Appointment.js";

const normalizeAppointment = (appointment) => {
  const json = typeof appointment.toJSON === "function" ? appointment.toJSON() : appointment;
  return {
    id: json.id,
    name: json.name,
    phone: json.phone,
    email: json.email,
    notes: json.notes || "",
    date: json.date,
    time: json.time,
    status: json.status,
    feeAmount: Number(json.feeAmount ?? 1000),
    paymentStatus: json.paymentStatus || "unpaid",
    paidAt: json.paidAt?.toISOString?.() || json.paidAt || null,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
  };
};

export const readAppointments = async () => {
  const appointments = await Appointment.find()
    .sort({ createdAt: -1, date: -1, time: -1 })
    .lean();

  return appointments.map(normalizeAppointment);
};

export const isAppointmentBooked = async (date, time) =>
  Boolean(await Appointment.exists({ date, time }));

export const createAppointmentRecord = async (appointment) => {
  const created = await Appointment.create(appointment);
  return normalizeAppointment(created);
};

export const updateAppointmentRecord = async (id, updates) => {
  const updated = await Appointment.findOneAndUpdate({ id }, updates, {
    new: true,
    runValidators: true,
  });

  return updated ? normalizeAppointment(updated) : null;
};

export const writeAppointments = async (appointments) => {
  await Appointment.deleteMany({});

  if (!appointments.length) {
    return;
  }

  await Appointment.insertMany(appointments, { ordered: true });
};
