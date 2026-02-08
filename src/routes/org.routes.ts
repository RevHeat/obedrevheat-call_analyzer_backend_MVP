import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireOrgContext } from "../middlewares/requireOrgContext";
import { createInviteController } from "../controllers/org.controller";
import { acceptInviteController } from "../controllers/org.accept-invite.controller";
import { requireOrgAdmin } from "../middlewares/requireOrgAdmin";
import { getMembersController } from "../controllers/org.controller";

const router = Router();

/**
 * Admin-only: create invite
 */
router.post(
  "/org/invites",
  requireAuth,
  requireOrgContext,
  requireOrgAdmin,
  createInviteController
);

/**
 * Public: accept invite + register
 * (NO auth, user does not exist yet)
 */
router.post(
  "/org/invites/accept",
  acceptInviteController
);

router.get(
  "/org/members",
  requireAuth,
  requireOrgContext,
  getMembersController
);

export default router;
