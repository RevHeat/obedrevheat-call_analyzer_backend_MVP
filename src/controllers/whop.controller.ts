import { Request, Response } from "express";
import { whopClient } from "../services/whop.service";
import {
  handleMembershipActivated,
  handleMembershipDeactivated,
  handlePaymentSucceeded,
  handlePaymentFailed,
} from "../services/whopWebhook.service";

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
