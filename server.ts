import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import { createServer as createViteServer } from "vite";
import { MongoMemoryServer } from 'mongodb-memory-server';

// --- CONFIG & CONSTANTS ---
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "gigflow-secret-key-12345";
const DATA_LIMIT = 10;

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

// --- DATABASE SETUP ---
async function setupDB() {
  const MONGO_URI = process.env.MONGO_URI;
  console.log("Setting up database...");

  try {
    if (MONGO_URI && MONGO_URI.trim() !== "") {
      console.log("Attempting to connect to MongoDB Atlas...");
      await mongoose.connect(MONGO_URI, {
        // Production-grade connection parameters
        maxPoolSize: 10,           // Pool size for typical OLTP workload (CMS/lead management)
        minPoolSize: 5,            // Pre-warmed connections for consistent performance
        maxIdleTimeMS: 60000,      // 60 seconds - release idle connections
        serverSelectionTimeoutMS: 5000,  // Fail fast if MongoDB unavailable
        socketTimeoutMS: 30000,    // 30 seconds - prevents hanging operations
        connectTimeoutMS: 10000,   // 10 seconds - connection establishment timeout
        retryWrites: true,         // Enable automatic transaction retries
        retryReads: true,          // Enable automatic read retries
        appName: "GigFlow-CMS",    // Helps with MongoDB Atlas monitoring
      });
      console.log("SUCCESS: Connected to MongoDB Atlas");
      return;
    }
  } catch (err: any) {
    console.error("FAILURE: MongoDB Atlas connection failed:", err.message);
  }

  try {
    console.log("Attempting to start In-Memory MongoDB...");
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log("SUCCESS: Connected to In-Memory MongoDB");
  } catch (err: any) {
    console.error("CRITICAL: In-Memory MongoDB also failed:", err.message);
    console.log("Warning: Server will start without a working database connection.");
  }
}

// --- SCHEMAS & MODELS ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "sales"], default: "sales" },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  status: { type: String, enum: ["New", "Contacted", "Qualified", "Lost"], default: "New" },
  source: { type: String, enum: ["Website", "Instagram", "Referral"], default: "Website" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const Lead = mongoose.model("Lead", leadSchema);

// --- MIDDLEWARE ---
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedRequest["user"];
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid Token" });
  }
};

const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access only" });
  }
  next();
};

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: "Validation failed", error: errors.array() });
  }
  next();
};

const errorHandler = (err: Error & { status?: number }, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};

// --- API ROUTES ---
async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  await setupDB();

  // Health Check
  app.get("/api/health", (req, res) => {
    const dbState = ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState];
    res.json({
      success: true,
      message: "API is healthy",
      db: dbState,
      env: process.env.NODE_ENV
    });
  });

  // Database Connection Middleware
  const dbCheck = (req: Request, res: Response, next: NextFunction) => {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database is not connected. Please try again in a few seconds."
      });
    }
    next();
  };

  // 1. Auth Routes
  app.post("/api/auth/register",
    dbCheck,
    [
      body("name").notEmpty().withMessage("Name is required"),
      body("email").isEmail().withMessage("Valid email is required"),
      body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { name, email, password, role } = req.body;
        console.log(`Registration attempt for: ${email}`);

        const exists = await User.findOne({ email });
        if (exists) {
          console.log(`User already exists: ${email}`);
          return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword, role: role || "sales" });
        console.log(`User created: ${user.email}`);

        const token = jwt.sign({ id: user._id.toString(), email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({
          success: true,
          data: { token, user: { id: user._id.toString(), name, email, role: user.role } },
          message: "Registration successful"
        });
      } catch (err: any) {
        console.error("Registration Error:", err);
        next(err);
      }
    }
  );

  app.post("/api/auth/login",
    dbCheck,
    [
      body("email").isEmail().withMessage("Valid email is required"),
      body("password").notEmpty().withMessage("Password is required"),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, password } = req.body;
        console.log(`Login attempt for: ${email}`);

        const user = await User.findOne({ email });
        if (!user) {
          console.log(`User not found: ${email}`);
          return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          console.log(`Password mismatch for: ${email}`);
          return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id.toString(), email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
        res.json({
          success: true,
          data: { token, user: { id: user._id.toString(), name: user.name, email, role: user.role } },
          message: "Login successful"
        });
      } catch (err: any) {
        console.error("Login Error:", err);
        next(err);
      }
    }
  );

  // 2. Stats Route (Admin Only)
  app.get("/api/stats", authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const totalLeads = await Lead.countDocuments();
      const qualifiedLeads = await Lead.countDocuments({ status: "Qualified" });
      const lostLeads = await Lead.countDocuments({ status: "Lost" });

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const newThisWeek = await Lead.countDocuments({ createdAt: { $gte: startOfWeek } });

      res.json({
        success: true,
        data: {
          totalLeads,
          qualifiedLeads,
          newThisWeek,
          lostLeads
        }
      });
    } catch (err) {
      next(err);
    }
  });

  // 3. Leads Routes
  app.get("/api/leads", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams = req.query;
      const { status, source, search, sort, page = 1 } = queryParams;
      const query: any = {};

      if (status) query.status = status;
      if (source) query.source = source;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ];
      }

      const limit = DATA_LIMIT;
      const skip = (Number(page) - 1) * limit;
      const sortOrder = sort === "oldest" ? 1 : -1;

      const total = await Lead.countDocuments(query);
      const leads = await Lead.find(query)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        data: leads,
        meta: {
          total,
          page: Number(page),
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/leads/export", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, source, search } = req.query as any;
      const query: any = {};

      if (status) query.status = status;
      if (source) query.source = source;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ];
      }

      const leads = await Lead.find(query).sort({ createdAt: -1 });
      res.json({ success: true, data: leads });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/leads/:id", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await Lead.findById(req.params.id);
      if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
      res.json({ success: true, data: lead });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/leads",
    authMiddleware,
    [
      body("name").notEmpty().withMessage("Name is required"),
      body("email").isEmail().withMessage("Valid email is required"),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authReq = req as AuthenticatedRequest;
        const lead = await Lead.create({ ...req.body, createdBy: authReq.user.id });
        res.status(201).json({ success: true, data: lead, message: "Lead created successfully" });
      } catch (err) {
        next(err);
      }
    }
  );

  app.put("/api/leads/:id", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
      res.json({ success: true, data: lead, message: "Lead updated successfully" });
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/leads/:id", authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await Lead.findByIdAndDelete(req.params.id);
      if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
      res.json({ success: true, message: "Lead deleted successfully" });
    } catch (err) {
      next(err);
    }
  });

  app.use(errorHandler);

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
