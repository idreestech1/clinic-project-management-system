import { Service } from "../models/Service.js";

export const getServices = async (_req, res, next) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json({ services: services.map((service) => service.toJSON()) });
  } catch (err) {
    next(err);
  }
};

export const createService = async (req, res, next) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({ service: service.toJSON() });
  } catch (err) {
    next(err);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!service) {
      res.status(404).json({ message: "Service not found." });
      return;
    }

    res.json({ service: service.toJSON() });
  } catch (err) {
    next(err);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
