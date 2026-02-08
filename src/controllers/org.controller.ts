import { Request, Response } from "express";
import OrgService from "../services/org.service";
import { OrganizationMember } from "../db/models/OrganizationMember";
import OrganizationInvite from "../db/models/OrganizationInvite";
import { User } from "../db/models/User";
import { Op } from "sequelize";
import Organization from "../db/models/Organization";
import { PLAN_SEATS_LIMIT, PLAN_KEYS, PlanKey } from "../constants/billing";

function getOrgContext(req: Request) {
  const orgId = (req as any)?.org_id as string | undefined;
  const userId = (req as any)?.user_id as string | undefined;

  if (!orgId || !userId) {
    return { orgId: null, userId: null };
  }

  return { orgId, userId };
}

function sendServiceError(res: Response, err: any) {
  const status = Number(err?.status) || 500;

  return res.status(status).json({
    ok: false,
    error: err?.code || "INTERNAL_ERROR",
    message: err?.message || "Something went wrong.",
  });
}

/**
 * POST /api/org/invites
 * Admin-only. Creates an invite and sends email.
 */
export const createInviteController = async (req: Request, res: Response) => {
  try {
    const { orgId, userId } = getOrgContext(req);
    if (!orgId || !userId) {
      return res.status(401).json({
        ok: false,
        error: "ORG_CONTEXT_MISSING",
        message: "Organization context is missing.",
      });
    }

    const email = String(req.body?.email || "").trim();
    const role = (req.body?.role as "admin" | "member" | undefined) || "member";

    // Optional: orgName can be passed from middleware if you store it in req
    const orgName = (req as any)?.org_name as string | undefined;

    const result = await OrgService.createInvite({
      orgId,
      invitedByUserId: userId,
      email,
      role,
      orgName,
    });

    return res.status(201).json({
      ok: true,
      invite: result.invite,
      inviteUrl: result.inviteUrl, // keep for dev/testing; you can remove later
    });
  } catch (err: any) {
    return sendServiceError(res, err);
  }
};

/**
 * Placeholder controllers we will implement later.
 * Keeping exports to avoid route import errors if you scaffold routes now.
 */

export const getMembersController = async (req: Request, res: Response) => {
  try {
    const { orgId, userId } = getOrgContext(req);
    if (!orgId || !userId) {
      return res.status(401).json({
        ok: false,
        error: "ORG_CONTEXT_MISSING",
        message: "Organization context is missing.",
      });
    }

    // Determine permissions from membership injected by requireOrgContext
    const membership = (req as any)?.membership;
    const canManageMembers = membership?.role === "admin";

    // Active members (join with User to get email/full_name)
    const memberships = await OrganizationMember.findAll({
      where: { org_id: orgId, status: "active" },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "full_name"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    const members = memberships.map((m: any) => ({
      id: m.user?.id || m.user_id,
      name: m.user?.full_name || null,
      email: m.user?.email || "",
      role: m.role as "admin" | "member",
      status: m.status as "active" | "invited" | "removed",
    }));

    // Pending invites
    const now = new Date();
    const invitesRows = await OrganizationInvite.findAll({
      where: {
        org_id: orgId,
        accepted_at: null,
        revoked_at: null,
        expires_at: { [Op.gt]: now },
      },
      attributes: ["id", "email", "role", "expires_at", "created_at"],
      order: [["created_at", "DESC"]],
    });

    const invites = invitesRows.map((inv: any) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role as "admin" | "member",
      expires_at: inv.expires_at,
    }));

    // Seats (MVP): we only return used count and leave limit null for now.
    const used = members.length;
    const org = await Organization.findByPk(orgId, {
      attributes: ["id", "plan_key", "seats_limit"],
    });
    const planKey = (org as any)?.plan_key || PLAN_KEYS.TRIAL;
    const limit =
    (org as any)?.seats_limit !== null && (org as any)?.seats_limit !== undefined
    ? ((org as any).seats_limit as number)
    : (PLAN_SEATS_LIMIT[planKey as PlanKey] ?? PLAN_SEATS_LIMIT[PLAN_KEYS.TRIAL]);

    return res.status(200).json({
      ok: true,
      data: {
        seats: { limit, used },
        can_manage_members: canManageMembers,
        members,
        invites,
      },
    });
  } catch (err: any) {
    return sendServiceError(res, err);
  }
};

export const revokeInviteController = async (_req: Request, res: Response) => {
  return res.status(501).json({ ok: false, error: "NOT_IMPLEMENTED" });
};

export const removeMemberController = async (_req: Request, res: Response) => {
  return res.status(501).json({ ok: false, error: "NOT_IMPLEMENTED" });
};

export const previewInviteController = async (_req: Request, res: Response) => {
  return res.status(501).json({ ok: false, error: "NOT_IMPLEMENTED" });
};

export const acceptInviteController = async (_req: Request, res: Response) => {
  return res.status(501).json({ ok: false, error: "NOT_IMPLEMENTED" });
};
