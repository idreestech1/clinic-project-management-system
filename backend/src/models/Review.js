import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    category: { type: String, enum: ["Surgery", "Consultation"], default: "Consultation" },
    stars: { type: Number, min: 1, max: 5, default: 5 },
    text: { type: String, required: true, trim: true },
    avatar: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["Approved", "Pending", "Hidden"], default: "Approved" },
  },
  { timestamps: true, versionKey: false }
);

reviewSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.date = new Date(ret.createdAt).toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    }).toUpperCase();
    ret.createdAt = ret.createdAt?.toISOString?.() || ret.createdAt;
    ret.updatedAt = ret.updatedAt?.toISOString?.() || ret.updatedAt;
    delete ret._id;
    return ret;
  },
});

export const Review = mongoose.model("Review", reviewSchema);
