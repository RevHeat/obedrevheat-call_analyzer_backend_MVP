import express, { Request, Response } from "express";
import cors from "cors";
import analyzeRoutes from "./routes/analyze.routes";

const app = express();
const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use("/api", analyzeRoutes);

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

export default app;
