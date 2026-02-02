// src/routes/billing.routes.ts
import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireOrgContext } from "../middlewares/requireOrgContext";
import {
  getBillingStatusController,
  createCheckoutSessionController,
  createBillingPortalSessionController,
} from "../controllers/billing.controller";

const router = Router();

router.get("/billing/status", requireAuth, requireOrgContext, getBillingStatusController);

router.post("/billing/checkout", requireAuth, requireOrgContext, createCheckoutSessionController);

router.post("/billing/portal", requireAuth, requireOrgContext, createBillingPortalSessionController);

export default router;
