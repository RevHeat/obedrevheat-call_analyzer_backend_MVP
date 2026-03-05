import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import analyzeRoutes from "./routes/analyze.routes";
import authRoutes from "./routes/auth.routes";
import feedbackRoutes from "./routes/feedback.routes";
import billingRoutes from "./routes/billing.routes";
import analysisRunsRoutes from "./routes/analysisRuns.routes";
import orgRoutes from "./routes/org.routes";
import purchaseSetupRoutes from "./routes/purchaseSetup.routes";

import { stripeWebhookController } from "./controllers/billing.controller";
import { whopWebhookController } from "./controllers/whop.controller";

const app = express();

// CORS — allow both direct frontend and Whop iframe origins
const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., server-to-server, curl)
      if (!origin) return callback(null, true);
      // Allow configured origin
      if (origin === allowedOrigin) return callback(null, true);
      // Allow Whop iframe origins
      if (origin.endsWith(".whop.com") || origin === "https://whop.com") {
        return callback(null, true);
      }
      // Allow localhost during development
      if (origin.startsWith("http://localhost:")) return callback(null, true);

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-whop-user-token"],
  })
);

// Webhook routes — MUST be before JSON parser (need raw body for signature verification)
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookController
);

app.post(
  "/api/whop/webhook",
  express.raw({ type: "application/json" }),
  whopWebhookController
);

app.use(express.json());
app.use(cookieParser());

app.use("/api", authRoutes);
app.use("/api", analyzeRoutes);
app.use("/api", feedbackRoutes);
app.use("/api", billingRoutes);
app.use("/api", analysisRunsRoutes);
app.use("/api", orgRoutes);
app.use("/api", purchaseSetupRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

export default app;
