import { Request, Response, NextFunction } from "express";
import { OrganizationMember } from "../db/models/OrganizationMember";
import Organization from "../db/models/Organization";

export async function requireOrgContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId =
      ((req as any)?.user_id as string | undefined) ||
      ((req as any)?.user?.id as string | undefined) ||
      ((req as any)?.auth?.userId as string | undefined) ||
      ((req as any)?.auth?.user?.id as string | undefined);

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: "MISSING_AUTH_CONTEXT",
        message: "Missing auth context",
      });
    }

    const membership = await OrganizationMember.findOne({
      where: { user_id: userId, status: "active" },
      order: [["created_at", "ASC"]],
    });

    if (!membership) {
      return res.status(403).json({
        ok: false,
        error: "ORG_MEMBERSHIP_REQUIRED",
        message: "User is not a member of any active organization",
      });
    }

    const orgId = (membership as any).org_id as string;

    const org = await Organization.findByPk(orgId);
    if (!org) {
      return res.status(404).json({ ok: false, error: "ORG_NOT_FOUND" });
    }

  
    (req as any).user_id = userId;
    (req as any).org_id = orgId;

    (req as any).membership = {
      org_id: (membership as any).org_id,
      user_id: (membership as any).user_id,
      role: (membership as any).role,
      status: (membership as any).status,
    };

    (req as any).org_name = (org as any).name || undefined;


    (req as any).auth = { ...(req as any).auth, userId, orgId };

    return next();
  } catch (err) {
    console.error("requireOrgContext error", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}
