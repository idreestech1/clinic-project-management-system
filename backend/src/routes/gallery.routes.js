import { Router } from "express";
import { createGalleryItem, deleteGalleryItem, getGalleryItems, updateGalleryItem } from "../controllers/gallery.controller.js";

const router = Router();

router.get("/", getGalleryItems);
router.post("/", createGalleryItem);
router.put("/:id", updateGalleryItem);
router.delete("/:id", deleteGalleryItem);

export default router;
