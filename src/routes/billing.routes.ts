import { Router } from "express";
import { getBillingStatusController } from "../controllers/billing.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireOrgContext } from "../middlewares/requireOrgContext";

const router = Router();

// GET /api/billing/status
router.get(
  "/billing/status",
  requireAuth,
  requireOrgContext,
  getBillingStatusController
);

export default router;
