import { Router } from "express"
import { requireAuth } from "../middlewares/requireAuth"
import { requireOrgContext } from "../middlewares/requireOrgContext"
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription"
import { listAnalysisRuns, getAnalysisRunById } from "../controllers/analysisRuns.controller"

const router = Router()

router.get(
  "/analysis-runs",
  requireAuth,
  requireOrgContext,
  requireActiveSubscription,
  listAnalysisRuns
)

router.get(
  "/analysis-runs/:id",
  requireAuth,
  requireOrgContext,
  requireActiveSubscription,
  getAnalysisRunById
)

export default router
