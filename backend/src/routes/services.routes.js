import { Router } from "express";
import { createService, deleteService, getServices, updateService } from "../controllers/services.controller.js";

const router = Router();

router.get("/", getServices);
router.post("/", createService);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

export default router;
