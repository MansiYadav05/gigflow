import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { AuthenticatedRequest, JWT_SECRET } from "./db";
import { validationResult } from "express-validator";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedRequest["user"];
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid Token" });
  }
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as any;
  if (authReq.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access only" });
  }
  next();
};

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: "Validation failed", error: errors.array() });
  }
  next();
};

export const errorHandler = (err: Error & { status?: number }, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  const status = (err as any).status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};

export const dbCheck = (req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database is not connected. Please try again in a few seconds."
    });
  }
  next();
};
