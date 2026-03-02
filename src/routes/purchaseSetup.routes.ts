import { Router } from "express";
import {
  validateSetupTokenController,
  completeSetupController,
} from "../controllers/purchaseSetup.controller";

const router = Router();

// Public routes (no auth required)
router.get("/purchase/setup/validate", validateSetupTokenController);
router.post("/purchase/setup/complete", completeSetupController);

export default router;
