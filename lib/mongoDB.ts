// lib/mongodb.ts
import mongoose, { Mongoose } from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ollamagpt";

if (!MONGO_URI) {
  throw new Error("❌ Please define the MONGO_URI environment variable inside .env.local");
}

// Store cached connection across hot-reloads in development
let cached = (global as any).mongoose as {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToMongo(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
