import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    specialty: { type: String, default: "Specialist Physician", trim: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    avatar: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

doctorSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.createdAt = ret.createdAt?.toISOString?.() || ret.createdAt;
    ret.updatedAt = ret.updatedAt?.toISOString?.() || ret.updatedAt;
    delete ret._id;
    return ret;
  },
});

export const Doctor = mongoose.model("Doctor", doctorSchema);
