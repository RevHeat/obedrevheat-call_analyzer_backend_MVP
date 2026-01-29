import { Router } from "express";
import { createFeedback } from "../controllers/feedback.controller";
import { requireAuth } from "../middlewares/requireAuth";


const router = Router();

router.post("/feedback",requireAuth, createFeedback);

export default router;
