import type { Request, Response } from "express";
import { createFeedback as createFeedbackSvc, type CreateFeedbackInput } from "../services/feedback.service";

export async function createFeedback(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const input = req.body as CreateFeedbackInput;

    await createFeedbackSvc(userId, input);

    return res.status(201).json({ ok: true });
  } catch (err: any) {
    const message = err?.message ?? "Invalid request";
    return res.status(400).json({ ok: false, error: message });
  }
}
