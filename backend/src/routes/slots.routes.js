import { Router } from "express";
import { getSlots } from "../controllers/slots.controller.js";

const router = Router();

router.get("/", getSlots);

export default router;
