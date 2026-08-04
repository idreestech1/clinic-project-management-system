import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    duration: { type: String, default: "10 min" },
    price: { type: String, default: "$60" },
    description: { type: String, default: "", trim: true },
    status: { type: String, enum: ["Live", "Draft", "Hidden"], default: "Live" },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

serviceSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.createdAt = ret.createdAt?.toISOString?.() || ret.createdAt;
    ret.updatedAt = ret.updatedAt?.toISOString?.() || ret.updatedAt;
    delete ret._id;
    return ret;
  },
});

export const Service = mongoose.model("Service", serviceSchema);
