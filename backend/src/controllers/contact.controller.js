import { ContactMessage } from "../models/ContactMessage.js";

// Temporary in-memory store for development
let contactMessages = [];

export const getContactMessages = async (_req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ messages: messages.map((message) => message.toJSON()) });
  } catch (err) {
    next(err);
  }
};

export const createContactMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      const error = new Error("Name, email and message are required.");
      error.statusCode = 400;
      throw error;
    }

    const created = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject || "General Inquiry",
      message: message.trim(),
    });

    res.status(201).json({ message: created.toJSON() });
  } catch (err) {
    next(err);
  }
};
