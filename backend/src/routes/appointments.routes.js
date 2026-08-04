import { Router } from "express";
import {
  createAppointment,
  getAppointments,
  updateAppointment,
} from "../controllers/appointments.controller.js";

const router = Router();

router.get("/", getAppointments);
router.post("/", createAppointment);
router.patch("/:id", updateAppointment);

export default router;
