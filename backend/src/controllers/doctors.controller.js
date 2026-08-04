import { Doctor } from "../models/Doctor.js";

export const getDoctors = async (_req, res, next) => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    res.json({ doctors: doctors.map((doctor) => doctor.toJSON()) });
  } catch (err) {
    next(err);
  }
};

export const createDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json({ doctor: doctor.toJSON() });
  } catch (err) {
    next(err);
  }
};

export const updateDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doctor) {
      res.status(404).json({ message: "Doctor not found." });
      return;
    }

    res.json({ doctor: doctor.toJSON() });
  } catch (err) {
    next(err);
  }
};

export const deleteDoctor = async (req, res, next) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
