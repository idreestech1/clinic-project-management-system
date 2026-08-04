import { Router } from "express";
import { createReview, deleteReview, getReviews, updateReview } from "../controllers/reviews.controller.js";

const router = Router();

router.get("/", getReviews);
router.post("/", createReview);
router.put("/:id", updateReview);
router.delete("/:id", deleteReview);

export default router;
