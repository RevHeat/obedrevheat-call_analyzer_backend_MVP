import { Request, Response } from "express";
import { whopClient, provisionGhlPurchase, verifyWhopUserToken, linkWhopUserByEmail } from "../services/whop.service";
import {
  handleMembershipActivated,
  handleMembershipDeactivated,
  handlePaymentSucceeded,
  handlePaymentFailed,
} from "../services/whopWebhook.service";

const GHL_WEBHOOK_SECRET = process.env.GHL_WEBHOOK_SECRET || "";

export async function ghlProvisionController(req: Request, res: Response) {
  try {
    // Verify the shared secret from GHL
    const secret = req.headers["x-ghl-secret"] as string || "";
    if (!GHL_WEBHOOK_SECRET || secret !== GHL_WEBHOOK_SECRET) {
      return res.status(401).json({ ok: false, error: "Invalid webhook secret" });
    }

    const { email, name } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ ok: false, error: "email is required" });
    }

    const result = await provisionGhlPurchase(email, name);
    return res.status(200).json({ ok: true, created: result.created });
  } catch (err: any) {
    console.error("ghlProvisionController error:", err?.message || err);
    return res.status(500).json({ ok: false, error: "Provisioning failed" });
  }
}

export async function whopLinkEmailController(req: Request, res: Response) {
  try {
    const whopToken = req.headers["x-whop-user-token"] as string || "";
    if (!whopToken) {
      return res.status(401).json({ ok: false, error: "Missing Whop token" });
    }

    const { userId: whopUserId } = await verifyWhopUserToken(whopToken);

    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ ok: false, error: "email is required" });
    }

    const result = await linkWhopUserByEmail(whopUserId, email);
    if (!result) {
      return res.status(404).json({
        ok: false,
        error: "no_match",
        message: "No account found with that email. Make sure you use the same email you purchased with.",
      });
    }

    return res.status(200).json({ ok: true, userId: result.userId });
  } catch (err: any) {
    console.error("whopLinkEmailController error:", err?.message || err);
    return res.status(500).json({ ok: false, error: "Linking failed" });
  }
}

export async function whopWebhookController(req: Request, res: Response) {
  try {
    const rawBody = (req.body as Buffer).toString("utf8");

    // Extract Standard Webhooks headers
    const headers: Record<string, string> = {
      "webhook-id": req.headers["webhook-id"] as string || "",
      "webhook-timestamp": req.headers["webhook-timestamp"] as string || "",
      "webhook-signature": req.headers["webhook-signature"] as string || "",
    };

    // Verify and unwrap the webhook using Whop SDK (Standard Webhooks spec)
    const event = whopClient.webhooks.unwrap(rawBody, { headers });

    console.log(">>> WHOP WEBHOOK:", event.type, new Date().toISOString());

    switch (event.type) {
      case "membership.activated":
        await handleMembershipActivated(event.data as any);
        break;

      case "membership.deactivated":
        await handleMembershipDeactivated(event.data as any);
        break;

      case "payment.succeeded":
        await handlePaymentSucceeded(event.data);
        break;

      case "payment.failed":
        await handlePaymentFailed(event.data);
        break;

      default:
        console.log(`Unhandled Whop webhook event: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("whopWebhookController error:", err?.message || err);
    return res.status(400).send(`Webhook Error: ${err?.message || "Unknown error"}`);
  }
}
