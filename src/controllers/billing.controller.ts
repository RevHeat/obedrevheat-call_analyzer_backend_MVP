import { Request, Response } from "express";
import Organization from "../db/models/Organization";
import { isSubscriptionAllowed } from "../constants/billing";

export async function getBillingStatusController(req: Request, res: Response) {
  try {
    const orgId = (req as any).org_id as string | undefined;

    if (!orgId) {
      return res.status(400).json({ ok: false, error: "ORG_NOT_FOUND" });
    }

    const org = await Organization.findByPk(orgId);

    if (!org) {
      return res.status(404).json({ ok: false, error: "ORG_NOT_FOUND" });
    }

    const allowed = isSubscriptionAllowed({
      subscription_status: org.subscription_status,
      trial_ends_at: org.trial_ends_at,
    });

    return res.json({
      ok: true,
      data: {
        org_id: org.id,
        plan_key: org.plan_key,
        subscription_status: org.subscription_status,
        trial_ends_at: org.trial_ends_at,
        current_period_end: org.current_period_end,
        seats_limit: org.seats_limit,
        allowed,
      },
    });
  } catch (err) {
    console.error("getBillingStatusController error", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}
