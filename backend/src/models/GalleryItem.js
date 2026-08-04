import mongoose from "mongoose";

const galleryItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    tag: { type: String, default: "Clinic", trim: true },
    image: { type: String, required: true, trim: true },
    status: { type: String, enum: ["Active", "Pending", "Draft", "Hidden"], default: "Active" },
  },
  { timestamps: true, versionKey: false }
);

galleryItemSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.createdAt = ret.createdAt?.toISOString?.() || ret.createdAt;
    ret.updatedAt = ret.updatedAt?.toISOString?.() || ret.updatedAt;
    delete ret._id;
    return ret;
  },
});

export const GalleryItem = mongoose.model("GalleryItem", galleryItemSchema);
