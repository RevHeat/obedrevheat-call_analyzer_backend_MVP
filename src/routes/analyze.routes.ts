import { Router } from "express";
import { analyzeController } from "../controllers/analyze.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireOrgContext } from "../middlewares/requireOrgContext";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { analyzeRateLimit } from "../middlewares/analyzeRateLimit";

const router = Router();

router.post(
  "/analyze",
  requireAuth,
  requireOrgContext,
  requireActiveSubscription,
  analyzeRateLimit,
  analyzeController
);

export default router;
