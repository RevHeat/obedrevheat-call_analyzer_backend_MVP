import { Request, Response, NextFunction } from "express";
import { OrganizationMember } from "../db/models/OrganizationMember";
import Organization from "../db/models/Organization";

export async function requireOrgContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any)?.auth?.userId as string | undefined;

    if (!userId) {
      return res.status(401).json({ ok: false, error: "Missing auth context" });
    }

    // MVP assumption: user belongs to a single active org
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

    // Optional: validate org exists (nice safety)
    const org = await Organization.findByPk(orgId);
    if (!org) {
      return res.status(404).json({ ok: false, error: "ORG_NOT_FOUND" });
    }

    // Attach to request for downstream usage
    (req as any).auth = { ...(req as any).auth, orgId };
    (req as any).org_id = orgId; 

    return next();
  } catch (err) {
    console.error("requireOrgContext error", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}
