import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { body } from "express-validator";
import { setupDB, User, Lead, JWT_SECRET, AuthenticatedRequest } from "./lib/db.js";
import { authMiddleware, adminMiddleware, dbCheck, errorHandler, validate } from "./lib/middleware";

const DATA_LIMIT = 10;

const app = express();
app.use(cors());
app.use(express.json());

// Initialize DB once
const initializeDB = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await setupDB();
    next();
  } catch (err) {
    console.error("DB Init Error:", err);
    res.status(503).json({ success: false, message: "Database initialization failed" });
  }
};

app.use(initializeDB);

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

// Auth Routes
app.post("/api/auth/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, role } = req.body;
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ success: false, message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hashedPassword, role: role || "sales" });

      const token = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        success: true,
        data: { token, user: { id: user._id.toString(), name, email, role: user.role } },
        message: "Registration successful"
      });
    } catch (err) {
      next(err);
    }
  }
);

app.post("/api/auth/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        data: { token, user: { id: user._id.toString(), name: user.name, email, role: user.role } },
        message: "Login successful"
      });
    } catch (err) {
      next(err);
    }
  }
);

// Stats Route
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

// Leads Routes
app.get("/api/leads", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, source, search, sort, page = 1 } = req.query;
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
      const authReq = req as any;
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

export default app;
