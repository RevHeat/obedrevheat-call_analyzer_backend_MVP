// src/routes/billing.routes.ts
import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireOrgContext } from "../middlewares/requireOrgContext";
import {
  getBillingStatusController,
  createCheckoutSessionController,
  createBillingPortalSessionController,
  syncBillingController,
  stripeWebhookController
} from "../controllers/billing.controller";

const router = Router();

router.get("/billing/status", requireAuth, requireOrgContext, getBillingStatusController);

router.post("/billing/checkout", requireAuth, requireOrgContext, createCheckoutSessionController);

router.post("/billing/portal", requireAuth, requireOrgContext, createBillingPortalSessionController);
router.post("/billing/sync", requireAuth, requireOrgContext, syncBillingController);
// router.post("/billing/webhook", stripeWebhookController);



export default router;
