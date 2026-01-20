import {Router} from "express";
import {analyzeController} from "../controllers/analyze.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.post("/analyze",requireAuth,analyzeController);

export default router;