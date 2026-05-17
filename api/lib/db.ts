import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "gigflow-secret-key-12345";

export interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

let cachedConnection: typeof mongoose | null = null;

// --- DATABASE SETUP ---
export async function setupDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const MONGO_URI = process.env.MONGO_URI;
  
  if (!MONGO_URI || MONGO_URI.trim() === "") {
    throw new Error("MONGO_URI is missing in environment variables");
  }

  try {
    console.log("Attempting to connect to MongoDB Atlas...");
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 60000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
      appName: "GigFlow-CMS",
    });
    cachedConnection = mongoose;
    console.log("SUCCESS: Connected to MongoDB Atlas");
    return cachedConnection;
  } catch (err: any) {
    console.error("FAILURE: MongoDB Connection:", err.message);
    throw err;
  }
}

// --- SCHEMAS & MODELS ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "sales"], default: "sales" },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", userSchema);

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  status: { type: String, enum: ["New", "Contacted", "Qualified", "Lost"], default: "New" },
  source: { type: String, enum: ["Website", "Instagram", "Referral"], default: "Website" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);

export { JWT_SECRET };
