import { Request, Response, NextFunction } from "express";

export function requireOrgAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const membership = (req as any)?.membership;

  if (!membership) {
    return res.status(401).json({
      ok: false,
      error: "ORG_CONTEXT_MISSING",
      message: "Organization context is missing.",
    });
  }

  if (membership.role !== "admin") {
    return res.status(403).json({
      ok: false,
      error: "ADMIN_ONLY",
      message: "Only organization admins can perform this action.",
    });
  }

  return next();
}
