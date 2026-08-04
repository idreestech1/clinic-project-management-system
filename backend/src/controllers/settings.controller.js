import { Setting } from "../models/Setting.js";

const DEFAULT_SETTINGS = {
  clinicName: "Dr. Hammad Medical Practice",
  adminEmail: "admin@gmail.com",
  openingTime: "04:00 PM",
  closingTime: "08:00 PM",
  appointmentDuration: "10 minutes",
  bookingDays: "Mon - Fri",
  advanceBooking: "30 days",
  autoConfirmation: true,
  notifyNewAppointment: true,
  notifyNewReview: true,
  notifyDailySummary: true,
  notifyGalleryApproved: false,
};

export const getSettings = async (_req, res, next) => {
  try {
    const settings = await Setting.findOneAndUpdate(
      { key: "clinic" },
      { $setOnInsert: { value: DEFAULT_SETTINGS } },
      { upsert: true, new: true }
    );
    res.json({ settings: settings.value });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const settings = await Setting.findOneAndUpdate(
      { key: "clinic" },
      { value: { ...DEFAULT_SETTINGS, ...req.body } },
      { upsert: true, new: true }
    );
    res.json({ settings: settings.value });
  } catch (err) {
    next(err);
  }
};
