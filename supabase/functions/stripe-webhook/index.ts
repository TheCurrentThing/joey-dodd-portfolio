import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@18.1.1";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getStripeClient, requireEnv, toIsoFromUnix } from "../_shared/stripe.ts";

type AdminClient = ReturnType<typeof createClient>;

function toStripeId(value: string | Stripe.Customer | Stripe.DeletedCustomer | Stripe.Subscription | null) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return value.id;
}

async function resolveUserId(adminClient: AdminClient, subscription: Stripe.Subscription) {
  const metadataUserId = subscription.metadata?.supabase_user_id;

  if (metadataUserId) {
    return metadataUserId;
  }

  const subscriptionId = subscription.id;
  const customerId = toStripeId(subscription.customer);

  if (subscriptionId) {
    const { data } = await adminClient
      .from("member_subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle();

    if (data?.user_id) {
      return data.user_id;
    }
  }

  if (customerId) {
    const { data } = await adminClient
      .from("member_subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (data?.user_id) {
      return data.user_id;
    }
  }

  return null;
}

async function persistSubscription(
  adminClient: AdminClient,
  userId: string,
  subscription: Stripe.Subscription
) {
  const payload = {
    user_id: userId,
    stripe_customer_id: toStripeId(subscription.customer),
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0]?.price?.id ?? null,
    status: subscription.status,
    current_period_end: toIsoFromUnix(subscription.current_period_end),
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: toIsoFromUnix(subscription.cancel_at),
    canceled_at: toIsoFromUnix(subscription.canceled_at),
    metadata: subscription.metadata ?? {},
  };

  const { error: upsertError } = await adminClient
    .from("member_subscriptions")
    .upsert(payload, { onConflict: "user_id" });

  if (upsertError) {
    throw upsertError;
  }

  const { error: refreshError } = await adminClient.rpc("refresh_profile_lessons_access", {
    target_user_id: userId,
  });

  if (refreshError) {
    throw refreshError;
  }
}

async function persistCheckoutSession(adminClient: AdminClient, session: Stripe.Checkout.Session) {
  const userId =
    session.metadata?.supabase_user_id ??
    (typeof session.client_reference_id === "string" ? session.client_reference_id : null);

  if (!userId) {
    console.warn("checkout.session.completed missing supabase user id", session.id);
    return;
  }

  const { error } = await adminClient.from("member_subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: toStripeId(session.customer),
      stripe_subscription_id: toStripeId(session.subscription),
      metadata: {
        checkout_session_id: session.id,
      },
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw error;
  }
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return jsonResponse({ error: "Missing Stripe signature header." }, { status: 400 });
    }

    const body = await request.text();
    const stripe = getStripeClient();
    const webhookSecret = requireEnv("STRIPE_WEBHOOK_SIGNING_SECRET");

    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    const adminClient = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false },
    });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await persistCheckoutSession(adminClient, session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(adminClient, subscription);

        if (!userId) {
          console.warn("Could not resolve subscription to Supabase user", subscription.id);
          break;
        }

        await persistSubscription(adminClient, userId, subscription);
        break;
      }

      default:
        break;
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error("stripe-webhook error", error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Stripe webhook processing failed.",
      },
      { status: 400 }
    );
  }
});
