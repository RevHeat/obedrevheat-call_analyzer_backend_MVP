import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev-secret-change-me";

type JwtPayload = { userId: string };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ ok: false, error: "Missing access token" });
  }

  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;

    // adjuntamos el userId al request para usarlo en controllers
    (req as any).auth = { userId: payload.userId };

    return next();
  } catch {
    return res.status(401).json({ ok: false, error: "Invalid or expired access token" });
  }
}
