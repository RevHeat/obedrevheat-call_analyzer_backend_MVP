import { Request, Response } from "express";
import PurchaseSetupService from "../services/purchaseSetup.service";

function sendServiceError(res: Response, err: any) {
  const status = Number(err?.status) || 500;
  return res.status(status).json({
    ok: false,
    error: err?.code || "INTERNAL_ERROR",
    message: err?.message || "Something went wrong.",
  });
}

export const validateSetupTokenController = async (req: Request, res: Response) => {
  try {
    const token = String(req.query?.token || "").trim();
    const result = await PurchaseSetupService.validateToken(token);
    return res.status(200).json({ ok: true, data: result });
  } catch (err: any) {
    return sendServiceError(res, err);
  }
};

export const completeSetupController = async (req: Request, res: Response) => {
  try {
    const token = String(req.body?.token || "").trim();
    const fullName = String(req.body?.fullName || "").trim();
    const password = String(req.body?.password || "");

    const result = await PurchaseSetupService.completeSetup({
      token,
      fullName,
      password,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    return sendServiceError(res, err);
  }
};
