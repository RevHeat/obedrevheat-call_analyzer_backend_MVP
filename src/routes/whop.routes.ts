import { Router } from "express";
import { ghlProvisionController } from "../controllers/whop.controller";

const router = Router();

// GHL webhook: provision a user after purchase
router.post("/whop/provision", ghlProvisionController);

export default router;
