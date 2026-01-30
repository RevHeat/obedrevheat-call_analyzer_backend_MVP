import { Request, Response, NextFunction } from "express";
import Organization from "../db/models/Organization";
import { isSubscriptionAllowed } from "../constants/billing";

export const requireActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orgId = (req as any).org_id;

    if (!orgId) {
      return res.status(400).json({ error: "ORG_NOT_FOUND" });
    }

    const org = await Organization.findByPk(orgId);

    if (!org) {
      return res.status(404).json({ error: "ORG_NOT_FOUND" });
    }

    const allowed = isSubscriptionAllowed({
      subscription_status: org.subscription_status,
      trial_ends_at: org.trial_ends_at,
    });

    if (!allowed) {
      return res.status(402).json({
        error: "BILLING_REQUIRED",
        plan_key: org.plan_key,
        subscription_status: org.subscription_status,
        trial_ends_at: org.trial_ends_at,
      });
    }

    return next();
  } catch (err) {
    console.error("requireActiveSubscription error", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
};
