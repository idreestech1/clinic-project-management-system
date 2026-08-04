import { User } from "../models/User.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "Admin@123";

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      const error = new Error("Name, email and password are required.");
      error.statusCode = 400;
      throw error;
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      const error = new Error("An account with this email already exists.");
      error.statusCode = 409;
      throw error;
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: await hashPassword(password),
      role: "patient",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=1a6fd4&color=fff`,
    });

    res.status(201).json({ user: user.toJSON() });
  } catch (err) {
    if (err.code === 11000) {
      err.message = "An account with this email already exists.";
      err.statusCode = 409;
    }
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      res.json({
        user: {
          name: "Dr. Hammad",
          email: ADMIN_EMAIL,
          role: "admin",
          status: "Active",
        },
      });
      return;
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      const error = new Error("Invalid email or password.");
      error.statusCode = 401;
      throw error;
    }

    res.json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};
