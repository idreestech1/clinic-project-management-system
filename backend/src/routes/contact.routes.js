import { Router } from "express";
import { createContactMessage, getContactMessages } from "../controllers/contact.controller.js";

const router = Router();

router.get("/", getContactMessages);
router.post("/", createContactMessage);

export default router;
