import mongoose from "mongoose";

// Disable mongoose command buffering so queries fail fast if not connected
mongoose.set("bufferCommands", false);

export const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Add it to backend/.env.");
  }

  // Use robust connection options
  const options = {
    serverSelectionTimeoutMS: 30000, // 30 s timeout for server selection
    socketTimeoutMS: 45000,
  };

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri, options);
  console.log("MongoDB connected");

  // Log connection events for debugging
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });
  mongoose.connection.once("open", () => {
    console.info("MongoDB connection is open");
  });
};
