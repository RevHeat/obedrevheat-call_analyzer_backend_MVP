import { Router } from "express";
import { ghlProvisionController, whopLinkEmailController } from "../controllers/whop.controller";

const router = Router();

// GHL webhook: provision a user after purchase
router.post("/whop/provision", ghlProvisionController);

// Whop iframe: link Whop user to existing account by email
router.post("/whop/link-email", whopLinkEmailController);

export default router;
