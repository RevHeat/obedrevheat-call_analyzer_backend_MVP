import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import analyzeRoutes from "./routes/analyze.routes";
import authRoutes from "./routes/auth.routes";
import feedbackRoutes from "./routes/feedback.routes";
import billingRoutes from "./routes/billing.routes";
import analysisRunsRoutes from "./routes/analysisRuns.routes";
import orgRoutes from "./routes/org.routes";

import { stripeWebhookController } from "./controllers/billing.controller"; // <-- agrega esto

const app = express();

const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookController
);

app.use(express.json());
app.use(cookieParser());

app.use("/api", authRoutes);
app.use("/api", analyzeRoutes);
app.use("/api", feedbackRoutes);
app.use("/api", billingRoutes);
app.use("/api", analysisRunsRoutes);
app.use("/api", orgRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

export default app;
