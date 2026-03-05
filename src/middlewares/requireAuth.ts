import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { verifyWhopUserToken, findOrCreateWhopUser } from "../services/whop.service";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev-secret-change-me";

type JwtPayload = { userId: string };

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // 1. Try standard Bearer JWT (existing direct auth)
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme === "Bearer" && token) {
    try {
      const payload = jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
      (req as any).auth = { userId: payload.userId, source: "local" };
      return next();
    } catch {
      // Token invalid — fall through to check Whop token
    }
  }

  // 2. Try Whop user token (iframe auth)
  const whopToken =
    (req.headers["x-whop-user-token"] as string) || "";

  if (whopToken) {
    try {
      const { userId: whopUserId } = await verifyWhopUserToken(whopToken);

      // Find or auto-provision user from Whop
      const { userId, orgId } = await findOrCreateWhopUser(whopUserId);

      (req as any).auth = { userId, orgId, source: "whop" };
      return next();
    } catch (err) {
      console.error("Whop token verification failed:", (err as Error).message);
      return res.status(401).json({ ok: false, error: "Invalid Whop user token" });
    }
  }

  // 3. No valid token found
  return res.status(401).json({ ok: false, error: "Missing access token" });
}
