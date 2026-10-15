import "dotenv/config";
import mongoose from "mongoose";

mongoose.set("strictQuery", true);

const connectOptions = {
  dbName: process.env.MONGODB_DB || "doctor-clinic",
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
};

const globalWithMongoose = globalThis;
if (!globalWithMongoose.__mongoose) {
  globalWithMongoose.__mongoose = { conn: null, promise: null, listenersAttached: false };
}

export const connectDatabase = async () => {
  // If already connected, return existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is missing. Add it to backend/.env or your deployment environment variables."
    );
  }

  // If a connection attempt is currently in progress, await it
  if (globalWithMongoose.__mongoose.promise) {
    await globalWithMongoose.__mongoose.promise;
    return mongoose.connection;
  }

  // Attach connection lifecycle events once
  if (!globalWithMongoose.__mongoose.listenersAttached) {
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err.message || err);
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
      globalWithMongoose.__mongoose.promise = null;
    });
    mongoose.connection.once("open", () => {
      console.info(`MongoDB connection established to "${mongoose.connection.name}"`);
    });
    globalWithMongoose.__mongoose.listenersAttached = true;
  }

  globalWithMongoose.__mongoose.promise = mongoose
    .connect(mongoUri, connectOptions)
    .then((m) => {
      globalWithMongoose.__mongoose.conn = m.connection;
      return m.connection;
    })
    .catch((err) => {
      globalWithMongoose.__mongoose.promise = null;
      globalWithMongoose.__mongoose.conn = null;
      throw err;
    });

  const connection = await globalWithMongoose.__mongoose.promise;
  return connection;
};
