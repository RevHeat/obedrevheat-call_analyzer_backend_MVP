import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import analyzeRoutes from "./routes/analyze.routes";
import authRoutes from "./routes/auth.routes";
import feedbackRoutes from "./routes/feedback.routes";

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

app.use(express.json());
app.use(cookieParser()); 

app.use("/api", authRoutes);
app.use("/api", analyzeRoutes);
app.use("/api", feedbackRoutes);


app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

export default app;
