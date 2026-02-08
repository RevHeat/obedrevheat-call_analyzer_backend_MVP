import { Request, Response } from "express";
import OrgAcceptInviteService from "../services/org.accept-invite.service";

function sendServiceError(res: Response, err: any) {
  const status = Number(err?.status) || 500;

  return res.status(status).json({
    ok: false,
    error: err?.code || "INTERNAL_ERROR",
    message: err?.message || "Something went wrong.",
  });
}

export const acceptInviteController = async (req: Request, res: Response) => {
  try {
    const token = String(req.body?.token || "").trim();
    const firstName = String(req.body?.firstName || "").trim();
    const lastName = String(req.body?.lastName || "").trim();
    const password = String(req.body?.password || "");

    const result = await OrgAcceptInviteService.acceptInviteAndRegister({
      token,
      firstName,
      lastName,
      password,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    return sendServiceError(res, err);
  }
};
