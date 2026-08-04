import { Review } from "../models/Review.js";

export const getReviews = async (req, res, next) => {
  try {
    // For public view, only return approved reviews
    // For admin view (no query), return all reviews
    const filter = req.query.public === "true" ? { status: "Approved" } : {};
    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json({ reviews: reviews.map((review) => review.toJSON()) });
  } catch (err) {
    next(err);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const { name, email, category, stars, text } = req.body;

    if (!name?.trim() || !text?.trim()) {
      const error = new Error("Name and review text are required.");
      error.statusCode = 400;
      throw error;
    }

    const review = await Review.create({
      name: name.trim(),
      email: String(email || "").trim().toLowerCase(),
      category: category || "Consultation",
      stars: Number(stars) || 5,
      text: text.trim(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=1a6fd4&color=fff`,
      status: req.body.status || "Pending",
    });

    res.status(201).json({ review: review.toJSON() });
  } catch (err) {
    next(err);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!review) {
      res.status(404).json({ message: "Review not found." });
      return;
    }

    res.json({ review: review.toJSON() });
  } catch (err) {
    next(err);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
