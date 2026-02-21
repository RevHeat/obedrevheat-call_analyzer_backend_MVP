// src/services/billing.service.ts

import Organization from "../db/models/Organization";
import Stripe from "stripe";
import {
  isSubscriptionAllowed,
  PLAN_KEYS,
  SUBSCRIPTION_STATUSES,
  PLAN_SEATS_LIMIT,
} from "../constants/billing";

type BillingInterval = "monthly" | "annual";

type BillingState = {
  org_id: string;
  plan_key: string | null;
  billing_interval: "monthly" | "annual" | null;
  subscription_status: string | null;
  trial_ends_at: Date | null;
  current_period_end: Date | null;
  seats_limit: number | null;
  allowed: boolean;
  is_trial: boolean;
  trial_days_left: number;
  billing_required: boolean;
};

function daysLeft(trialEndsAt: Date | null) {
  if (!trialEndsAt) return 0;
  const ms = trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

//PROD
const PRICE_MAP = {
  solo: {
    monthly: "price_1T3KfDLBlOKCyaWYx70FhyfI",
    annual: "price_1T3KY3LBlOKCyaWY3N2xDTKL",
  },
  team_5: {
    monthly: "price_1SwOo1LBlOKCyaWYPCYcokwO",
    annual: "price_1SwOs6LBlOKCyaWYXjJNsHsD",
  },
  team_10: {
    monthly: "price_1SwOqiLBlOKCyaWYfEHe6guV",
    annual: "price_1SwOqiLBlOKCyaWYicjsh32L",
  },
} as const;

//dev
// const PRICE_MAP = {
//   solo: {
//     monthly: "price_1SwOmgLBlOKCyaWYLPz8ECzj",
//     annual: "price_1SwOtFLBlOKCyaWY7WKjV7Xv",
//   },
//   team_5: {
//     monthly: "price_1SwOo1LBlOKCyaWYi0PdlyZ7",
//     annual: "price_1SwOs6LBlOKCyaWYxzeDpuE4",
//   },
//   team_10: {
//     monthly: "price_1SwOqjLBlOKCyaWY0snBMg8V",
//     annual: "price_1SwOqkLBlOKCyaWY7PsNhQF2",
//   },
// } as const;

/* reverse map para webhooks */
const PRICE_TO_PLAN: Record<
  string,
  { plan_key: "solo" | "team_5" | "team_10"; interval: BillingInterval }
> = Object.entries(PRICE_MAP).reduce((acc, [planKey, intervals]) => {
  (Object.keys(intervals) as BillingInterval[]).forEach((interval) => {
    const priceId = (intervals as any)[interval] as string;
    acc[priceId] = { plan_key: planKey as any, interval };
  });
  return acc;
}, {} as any);

function normalizeInterval(v: any): BillingInterval {
  return v === "annual" ? "annual" : "monthly";
}

function stripeStatusToInternal(status: Stripe.Subscription.Status) {
  if (status === "active") return SUBSCRIPTION_STATUSES.ACTIVE;
  if (status === "trialing") return SUBSCRIPTION_STATUSES.TRIALING;
  if (status === "past_due") return SUBSCRIPTION_STATUSES.PAST_DUE;
  if (status === "canceled" || status === "unpaid")
    return SUBSCRIPTION_STATUSES.CANCELED;
  return SUBSCRIPTION_STATUSES.EXPIRED;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}


async function retrieveSubscriptionWithRetry(
  subId: string,
  attempts = 3
): Promise<Stripe.Subscription> {
  let last: Stripe.Subscription | null = null;

  for (let i = 1; i <= attempts; i++) {
    const sub = await stripe.subscriptions.retrieve(subId);
    last = sub;

    const cpe = (sub as any).current_period_end as number | null | undefined;
    console.log("[STRIPE] retrieve sub snapshot", {
      subId,
      attempt: i,
      status: sub.status,
      current_period_end: cpe ?? null,
      billing_cycle_anchor: (sub as any).billing_cycle_anchor ?? null,
    });

    if (cpe) return sub;

    // backoff pequeño: 250ms, 500ms, 1000ms
    if (i < attempts) await sleep(250 * Math.pow(2, i - 1));
  }

  return last!;
}

export class BillingService {
  async getBillingState(orgId: string): Promise<BillingState> {
    const org = await Organization.findByPk(orgId);
    if (!org) throw new Error("ORG_NOT_FOUND");

    const trialEnds = org.trial_ends_at ? new Date(org.trial_ends_at) : null;

    const allowed = isSubscriptionAllowed({
      subscription_status: org.subscription_status,
      trial_ends_at: org.trial_ends_at,
    });

    const isTrial = org.subscription_status === SUBSCRIPTION_STATUSES.TRIALING;

    return {
      org_id: org.id,
      plan_key: org.plan_key ?? null,
      billing_interval: org.billing_interval ?? null,
      subscription_status: org.subscription_status ?? null,
      trial_ends_at: trialEnds,
      current_period_end: org.current_period_end
        ? new Date(org.current_period_end)
        : null,
      seats_limit: org.seats_limit ?? null,
      allowed,
      is_trial: isTrial,
      trial_days_left: isTrial ? daysLeft(trialEnds) : 0,
      billing_required: !allowed,
    };
  }

  async createCheckoutSession(
    orgId: string,
    userId: string,
    planKey: string,
    intervalRaw?: any
  ) {
    const interval = normalizeInterval(intervalRaw);

    const allowedTargets = [
      PLAN_KEYS.SOLO,
      PLAN_KEYS.TEAM_5,
      PLAN_KEYS.TEAM_10,
    ];
    if (!allowedTargets.includes(planKey as any))
      throw new Error("INVALID_PLAN_KEY");

    const org = await Organization.findByPk(orgId);
    if (!org) throw new Error("ORG_NOT_FOUND");

    const priceId = PRICE_MAP[planKey as "solo" | "team_5" | "team_10"]?.[
      interval
    ];
    if (!priceId) throw new Error("PRICE_NOT_FOUND");

    let customerId = org.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org.name,
        metadata: { org_id: org.id },
      });
      customerId = customer.id;
      await org.update({ stripe_customer_id: customerId });
    }

    const successUrl = `${process.env.APP_URL}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.APP_URL}/app/billing?checkout=cancel`;

    const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData =
      {
        metadata: {
          org_id: org.id,
          user_id: userId,
          plan_key: String(planKey),
          interval: String(interval),
        },
      };

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        client_reference_id: org.id,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        subscription_data: subscriptionData,
        metadata: {
          org_id: org.id,
          user_id: userId,
          plan_key: String(planKey),
          interval: String(interval),
        },
      });

      return { url: session.url };
    } catch (e: any) {
      console.error("❌ STRIPE ERROR MESSAGE:", e?.message);
      console.error("❌ STRIPE ERROR RAW:", e);
      throw e;
    }
  }

  async createBillingPortalSession(orgId: string) {
    const org = await Organization.findByPk(orgId);
    if (!org) throw new Error("ORG_NOT_FOUND");
    if (!org.stripe_customer_id) throw new Error("NO_STRIPE_CUSTOMER");

    const returnUrl = `${process.env.APP_URL}/app/billing`;

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async syncFromStripeCheckoutSession(sessionId: string) {
    if (!sessionId) throw new Error("MISSING_SESSION_ID");

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    if (!session) throw new Error("SESSION_NOT_FOUND");
    if (session.mode !== "subscription") throw new Error("INVALID_SESSION_MODE");

    const orgId = session.client_reference_id as string | null;
    if (!orgId) throw new Error("MISSING_CLIENT_REFERENCE_ID");

    const org = await Organization.findByPk(orgId);
    if (!org) throw new Error("ORG_NOT_FOUND");

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;

    if (!customerId) throw new Error("MISSING_CUSTOMER_ID");

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    if (!subscriptionId) throw new Error("MISSING_SUBSCRIPTION");

    const subExpanded = await retrieveSubscriptionWithRetry(subscriptionId, 3);

    if ((subExpanded as any).deleted === true) {
      throw new Error("SUBSCRIPTION_DELETED");
    }

    type StripeSubShape = Stripe.Subscription & {
      current_period_end?: number | null;
      trial_end?: number | null;
      items: Stripe.Subscription["items"];
      status: Stripe.Subscription.Status;
      id: string;
    };

    const sub = subExpanded as StripeSubShape;

    const priceId = sub.items.data?.[0]?.price?.id;
    if (!priceId) throw new Error("NO_PRICE_ON_SUBSCRIPTION");

    const mapped = PRICE_TO_PLAN[priceId];
    if (!mapped) throw new Error("UNKNOWN_PRICE_ID");

    const internalStatus = stripeStatusToInternal(sub.status);

    const trialEndsAt =
      internalStatus === SUBSCRIPTION_STATUSES.TRIALING && sub.trial_end
        ? new Date(sub.trial_end * 1000)
        : null;

    const currentPeriodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : null;

    const seatsLimit = PLAN_SEATS_LIMIT[mapped.plan_key] ?? 1;

    // ✅ FIX CRÍTICO:
    // NO sobrescribir current_period_end con null (porque ya viste que subscription.created lo setea bien)
    const updatePayload: any = {
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      plan_key: mapped.plan_key,
      subscription_status: internalStatus,
      trial_ends_at: trialEndsAt,
      seats_limit: seatsLimit,
      billing_interval: mapped.interval,
    };

    if (currentPeriodEnd) {
      updatePayload.current_period_end = currentPeriodEnd;
    } else {
      console.warn(
        "[SYNC] current_period_end is null from Stripe retrieve; NOT overwriting DB",
        {
          sessionId,
          orgId: org.id,
          subId: sub.id,
          plan_key: mapped.plan_key,
          interval: mapped.interval,
          status: sub.status,
        }
      );
    }

    await org.update(updatePayload);

    return {
      ok: true,
      org_id: org.id,
      plan_key: mapped.plan_key,
      interval: mapped.interval,
      subscription_status: internalStatus,
      trial_ends_at: trialEndsAt,
      current_period_end: currentPeriodEnd,
      seats_limit: seatsLimit,
    };
  }

  async handleStripeWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("[WEBHOOK] checkout.session.completed received", {
          sessionId: session.id,
          mode: session.mode,
          client_reference_id: session.client_reference_id,
          customer: session.customer,
          subscription: session.subscription,
        });

        if (session.mode !== "subscription") return;

        try {
          const result = await this.syncFromStripeCheckoutSession(session.id);

          console.log("[WEBHOOK] checkout.session.completed synced billing", {
            sessionId: session.id,
            org_id: result.org_id,
            plan_key: result.plan_key,
            interval: result.interval,
            subscription_status: result.subscription_status,
            current_period_end: result.current_period_end?.toISOString?.() ?? null,
            seats_limit: result.seats_limit,
          });
        } catch (e: any) {
          console.warn("[WEBHOOK] checkout.session.completed sync FAILED", {
            sessionId: session.id,
            err: e?.message || e,
          });
        }

        return;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        type StripeSubShape = Stripe.Subscription & {
          current_period_end?: number | null;
          trial_end?: number | null;
          items: Stripe.Subscription["items"];
          status: Stripe.Subscription.Status;
          id: string;
        };

        const sub = event.data.object as StripeSubShape;

        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (!customerId) throw new Error("MISSING_CUSTOMER_ID");

        let org = await Organization.findOne({
          where: { stripe_customer_id: customerId },
        });

        const metaOrgId = (sub.metadata?.org_id || (sub.metadata as any)?.orgId) as
          | string
          | undefined;

        if (!org && metaOrgId) {
          org = await Organization.findByPk(metaOrgId);
        }

        if (!org) {
          console.warn("[WEBHOOK] subscription.* ORG NOT FOUND", {
            eventType: event.type,
            customerId,
            metaOrgId,
            subId: sub.id,
          });
          return;
        }

        const priceId = sub.items?.data?.[0]?.price?.id;
        if (!priceId) {
          console.warn("[WEBHOOK] subscription.* MISSING PRICE ID", {
            eventType: event.type,
            subId: sub.id,
            customerId,
            metadata: sub.metadata,
          });
          return;
        }

        const mapped = PRICE_TO_PLAN[priceId];
        if (!mapped) {
          console.warn("[WEBHOOK] subscription.* UNKNOWN PRICE ID", {
            eventType: event.type,
            subId: sub.id,
            priceId,
            knownPriceIds: Object.keys(PRICE_TO_PLAN),
            metadata: sub.metadata,
          });
          return;
        }

        const internalStatus = stripeStatusToInternal(sub.status);

        const trialEndsAt =
          internalStatus === SUBSCRIPTION_STATUSES.TRIALING && sub.trial_end
            ? new Date(sub.trial_end * 1000)
            : null;

        let periodEndSeconds: number | null | undefined = sub.current_period_end;

        if (!periodEndSeconds) {
          try {
            const fresh = await stripe.subscriptions.retrieve(sub.id);
            periodEndSeconds = (fresh as any).current_period_end ?? null;
            console.log("[WEBHOOK] subscription.* retrieved fresh sub for period end", {
              subId: sub.id,
              periodEndSeconds,
            });
          } catch (e: any) {
            console.warn("[WEBHOOK] subscription.* retrieve FAILED", {
              subId: sub.id,
              err: e?.message || e,
            });
            periodEndSeconds = null;
          }
        }

        const currentPeriodEnd =
          periodEndSeconds ? new Date(periodEndSeconds * 1000) : null;

        const seatsLimit = PLAN_SEATS_LIMIT[mapped.plan_key] ?? 1;

        const updatePayload: any = {
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          plan_key: mapped.plan_key,
          billing_interval: mapped.interval,
          subscription_status: internalStatus,
          trial_ends_at: trialEndsAt,
          seats_limit: seatsLimit,
        };

        if (currentPeriodEnd) {
          updatePayload.current_period_end = currentPeriodEnd;
        } else {
          console.warn(
            "[WEBHOOK] subscription.* missing current_period_end (will not overwrite)",
            { subId: sub.id, status: sub.status, priceId, mapped }
          );
        }

        await org.update(updatePayload);

        console.log("[WEBHOOK] subscription.* org updated", {
          orgId: org.id,
          plan_key: mapped.plan_key,
          billing_interval: mapped.interval,
          subscription_status: internalStatus,
          current_period_end: currentPeriodEnd?.toISOString?.() ?? null,
          seats_limit: seatsLimit,
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
        });

        return;
      }

      case "invoice.payment_succeeded":
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
          customer?: string | Stripe.Customer | null;
        };

        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;

        if (!subscriptionId) {
          console.warn("[WEBHOOK] invoice.* missing subscriptionId", {
            eventType: event.type,
            invoiceId: invoice.id,
          });
          return;
        }

        let sub: Stripe.Subscription;
        try {
          sub = await stripe.subscriptions.retrieve(subscriptionId);
        } catch (e: any) {
          console.warn("[WEBHOOK] invoice.* subscription retrieve FAILED", {
            eventType: event.type,
            subscriptionId,
            err: e?.message || e,
          });
          return;
        }

        const periodEndSeconds = (sub as any).current_period_end as
          | number
          | null
          | undefined;

        console.log("[WEBHOOK] invoice.* subscription snapshot", {
          eventType: event.type,
          invoiceId: invoice.id,
          subId: sub.id,
          status: sub.status,
          current_period_end: periodEndSeconds ?? null,
          billing_cycle_anchor: (sub as any).billing_cycle_anchor ?? null,
          hasItems: !!(sub as any)?.items?.data?.length,
        });

        const currentPeriodEnd =
          periodEndSeconds ? new Date(periodEndSeconds * 1000) : null;

        const internalStatus = stripeStatusToInternal(sub.status);

        let org =
          (await Organization.findOne({ where: { stripe_subscription_id: sub.id } })) ||
          (await Organization.findOne({
            where: {
              stripe_customer_id:
                typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
            },
          }));

        const metaOrgId = (sub.metadata?.org_id || (sub.metadata as any)?.orgId) as
          | string
          | undefined;

        if (!org && metaOrgId) {
          org = await Organization.findByPk(metaOrgId);
        }

        if (!org) {
          console.warn("[WEBHOOK] invoice.* ORG NOT FOUND", {
            eventType: event.type,
            subId: sub.id,
            customerId:
              typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
            metaOrgId,
          });
          return;
        }

        const updatePayload: any = {
          stripe_customer_id:
            typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
          stripe_subscription_id: sub.id,
          subscription_status: internalStatus,
        };

        if (currentPeriodEnd) {
          updatePayload.current_period_end = currentPeriodEnd;
        } else {
          console.warn(
            "[WEBHOOK] invoice.* no current_period_end in retrieve; skipping field",
            { eventType: event.type, subId: sub.id, status: sub.status }
          );
        }

        await org.update(updatePayload);

        console.log("[WEBHOOK] invoice.* org updated (status; period end if present)", {
          eventType: event.type,
          orgId: org.id,
          subId: sub.id,
          subscription_status: internalStatus,
          current_period_end: currentPeriodEnd?.toISOString?.() ?? "(unchanged)",
        });

        return;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (!customerId) throw new Error("MISSING_CUSTOMER_ID");

        const org = await Organization.findOne({
          where: { stripe_customer_id: customerId },
        });

        if (!org) {
          console.warn("[WEBHOOK] subscription.deleted org not found", {
            customerId,
            subId: sub.id,
          });
          return;
        }

        await org.update({
          subscription_status: SUBSCRIPTION_STATUSES.CANCELED,
        });

        console.log("[WEBHOOK] subscription.deleted org updated", {
          orgId: org.id,
          subId: sub.id,
          stripe_customer_id: customerId,
        });

        return;
      }

      default:
        return;
    }
  }
}
