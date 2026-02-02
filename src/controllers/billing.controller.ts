// src/controllers/billing.controller.ts
import { Request, Response } from "express";
import { BillingService } from "../services/billing.service";

const billingService = new BillingService();

export async function getBillingStatusController(req: Request, res: Response) {
  try {
    const orgId = (req as any).org_id as string | undefined;
    if (!orgId) return res.status(400).json({ ok: false, error: "ORG_NOT_FOUND" });

    const state = await billingService.getBillingState(orgId);
    return res.json({ ok: true, data: state });
  } catch (err: any) {
    const msg = err?.message || "INTERNAL_SERVER_ERROR";
    if (msg === "ORG_NOT_FOUND") return res.status(404).json({ ok: false, error: msg });

    console.error("getBillingStatusController error:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function createCheckoutSessionController(req: Request, res: Response) {
  try {
    const orgId = (req as any).org_id as string | undefined;
    const userId = (req as any).auth?.userId as string | undefined;

    if (!orgId) return res.status(400).json({ ok: false, error: "ORG_NOT_FOUND" });
    if (!userId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { plan_key } = req.body as { plan_key?: string };
    if (!plan_key) return res.status(400).json({ ok: false, error: "MISSING_PLAN_KEY" });

    const { url } = await billingService.createCheckoutSession(orgId, userId, plan_key);
    return res.json({ ok: true, url });
  } catch (err: any) {
    const msg = err?.message || "INTERNAL_SERVER_ERROR";
    if (msg === "ORG_NOT_FOUND") return res.status(404).json({ ok: false, error: msg });
    if (msg === "INVALID_PLAN_KEY") return res.status(400).json({ ok: false, error: msg });

    console.error("createCheckoutSessionController error:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function createBillingPortalSessionController(req: Request, res: Response) {
  try {
    const orgId = (req as any).org_id as string | undefined;
    const userId = (req as any).auth?.userId as string | undefined;

    if (!orgId) return res.status(400).json({ ok: false, error: "ORG_NOT_FOUND" });
    if (!userId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { url } = await billingService.createBillingPortalSession(orgId);
    return res.json({ ok: true, url });
  } catch (err: any) {
    const msg = err?.message || "INTERNAL_SERVER_ERROR";
    if (msg === "ORG_NOT_FOUND") return res.status(404).json({ ok: false, error: msg });

    console.error("createBillingPortalSessionController error:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_SERVER_ERROR" });
  }
}

// (para después)
// export async function stripeWebhookController(req: Request, res: Response) { ... }
