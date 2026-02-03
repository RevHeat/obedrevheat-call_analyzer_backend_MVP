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
// const PRICE_MAP = {
//   solo: {
//     monthly: "price_1SwOmfLBlOKCyaWYOGZKC28d",
//     annual: "price_1SwOtELBlOKCyaWYpDMuxB2m",
//   },
//   team_5: {
//     monthly: "price_1SwOo1LBlOKCyaWYPCYcokwO",
//     annual: "price_1SwOs6LBlOKCyaWYXjJNsHsD",
//   },
//   team_10: {
//     monthly: "price_1SwOqiLBlOKCyaWYfEHe6guV",
//     annual: "price_1SwOqiLBlOKCyaWYicjsh32L",
//   },
// } as const;

//dev
const PRICE_MAP = {
  solo: {
    monthly: "price_1SwOmgLBlOKCyaWYLPz8ECzj",
    annual: "price_1SwOtFLBlOKCyaWY7WKjV7Xv",
  },
  team_5: {
    monthly: "price_1SwOo1LBlOKCyaWYi0PdlyZ7",
    annual: "price_1SwOs6LBlOKCyaWYxzeDpuE4",
  },
  team_10: {
    monthly: "price_1SwOqjLBlOKCyaWY0snBMg8V",
    annual: "price_1SwOqkLBlOKCyaWY7PsNhQF2",
  },
} as const;

/* reverse map para webhooks (luego) */
const PRICE_TO_PLAN: Record<
  string,
  { plan_key: "solo" | "team_5" | "team_10"; interval: BillingInterval }
> = Object.entries(PRICE_MAP).reduce((acc, [planKey, intervals]) => {
  (Object.keys(intervals) as BillingInterval[]).forEach((interval) => {
    const priceId = intervals[interval];
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

    /* Create / reuse Stripe customer */
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
    const cancelUrl = `${process.env.APP_URL}/pricing?checkout=cancel`;



  /* Charge immediately on checkout (no trial) */

    const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData =
      {
        metadata: {
          org_id: org.id,
          user_id: userId,
          plan_key: String(planKey),
          interval: String(interval),
        },
      };

    // if (
    //   org.subscription_status === SUBSCRIPTION_STATUSES.TRIALING &&
    //   org.trial_ends_at
    // ) {
    //   subscriptionData.trial_end = Math.floor(
    //     new Date(org.trial_ends_at).getTime() / 1000
    //   );
    // }

        console.log("====== STRIPE CHECKOUT DEBUG ======");
        console.log("Stripe key prefix:", process.env.STRIPE_SECRET_KEY?.slice(0, 8));
        console.log("APP_URL:", process.env.APP_URL);
        console.log("Plan:", planKey);
        console.log("Interval:", interval);
        console.log("Price ID:", priceId);
        console.log("Customer ID:", customerId);
        console.log("===================================");

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

    const returnUrl = `${process.env.APP_URL}/pricing`;

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

  const subExpanded =
    typeof session.subscription === "string"
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session.subscription;

  if (!subExpanded) throw new Error("MISSING_SUBSCRIPTION");

  // deleted subscription (runtime check)
  if ((subExpanded as any).deleted === true) {
    throw new Error("SUBSCRIPTION_DELETED");
  }

  // local shape to avoid Stripe typings mismatch
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

  await org.update({
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    plan_key: mapped.plan_key,
    subscription_status: internalStatus,
    trial_ends_at: trialEndsAt, 
    current_period_end: currentPeriodEnd,
    seats_limit: seatsLimit,
  });

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



  /* Webhook lo hacemos después, paso siguiente */
}
