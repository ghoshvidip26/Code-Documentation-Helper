import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Missing MONGODB_URI in environment");
}

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var mongooseCache: CachedConnection | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function dbConnect() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    // normalize URI safely
    let uri = MONGODB_URI!;
    try {
      uri = new URL(MONGODB_URI!).toString();
    } catch (e) {
      console.warn("⚠️ Invalid Mongo URI — using raw string");
    }

    console.log("🚀 Connecting to MongoDB...");

    cached!.promise = mongoose.connect(uri, opts).then((mongoose) => {
      console.log("✅ MongoDB Connected");
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    console.error("❌ MongoDB Connection Error:", e);
    throw e;
  }

  return cached!.conn;
}
