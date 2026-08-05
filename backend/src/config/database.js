import mongoose from "mongoose";

// Disable mongoose command buffering so queries fail fast if not connected
mongoose.set("bufferCommands", false);
mongoose.set("strictQuery", true);

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("MONGODB_URI is missing. Add it to backend/.env or your deployment environment.");
}

const connectOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4,
};

const globalWithMongoose = globalThis;
if (!globalWithMongoose.__mongoose) {
  globalWithMongoose.__mongoose = { conn: null, promise: null };
}

export const connectDatabase = async () => {
  if (globalWithMongoose.__mongoose.conn) {
    return globalWithMongoose.__mongoose.conn;
  }

  if (!globalWithMongoose.__mongoose.promise) {
    globalWithMongoose.__mongoose.promise = mongoose
      .connect(mongoUri, connectOptions)
      .then(() => {
        globalWithMongoose.__mongoose.conn = mongoose.connection;
        return globalWithMongoose.__mongoose.conn;
      })
      .catch((err) => {
        globalWithMongoose.__mongoose.promise = null;
        throw err;
      });
  }

  const connection = await globalWithMongoose.__mongoose.promise;

  connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });
  connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });
  connection.once("open", () => {
    console.info("MongoDB connection is open");
  });

  console.log("MongoDB connected");
  return connection;
};
