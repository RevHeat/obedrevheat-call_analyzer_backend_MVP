import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();

router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);
router.post("/auth/refresh", AuthController.refresh);
router.post("/auth/logout", AuthController.logout);
router.post("/auth/forgot-password", AuthController.forgotPassword);
router.post("/auth/reset-password", AuthController.resetPassword);

export default router;
