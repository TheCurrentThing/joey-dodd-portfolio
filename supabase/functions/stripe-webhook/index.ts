import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@18.1.1";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getStripeClient, requireEnv } from "../_shared/stripe.ts";

type AdminClient = ReturnType<typeof createClient>;

function toStripeId(
  value:
    | string
    | Stripe.Customer
    | Stripe.DeletedCustomer
    | Stripe.PaymentIntent
    | Stripe.DeletedPaymentIntent
    | null
) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return value.id;
}

async function persistModulePurchase(adminClient: AdminClient, session: Stripe.Checkout.Session) {
  const userId =
    session.metadata?.supabase_user_id ??
    (typeof session.client_reference_id === "string" ? session.client_reference_id : null);
  const moduleId = session.metadata?.module_id ?? null;

  if (!userId || !moduleId) {
    console.warn("checkout.session.completed missing fulfillment metadata", session.id);
    return;
  }

  const { data: module, error: moduleError } = await adminClient
    .from("lesson_modules")
    .select("id, stripe_price_id")
    .eq("id", moduleId)
    .maybeSingle();

  if (moduleError) {
    throw moduleError;
  }

  if (!module) {
    throw new Error(`Lesson module not found for checkout session ${session.id}.`);
  }

  const { data: purchase, error: purchaseError } = await adminClient
    .from("lesson_module_purchases")
    .upsert(
      {
        user_id: userId,
        module_id: module.id,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: toStripeId(session.payment_intent),
        stripe_customer_id: toStripeId(session.customer),
        stripe_price_id: module.stripe_price_id,
        amount_total: session.amount_total,
        currency: session.currency,
        payment_status: session.payment_status === "paid" ? "paid" : "pending",
        source: "stripe",
        metadata: session.metadata ?? {},
      },
      { onConflict: "stripe_checkout_session_id" }
    )
    .select("id")
    .single();

  if (purchaseError || !purchase) {
    throw purchaseError ?? new Error("Failed to persist lesson purchase.");
  }

  if (session.payment_status !== "paid") {
    return;
  }

  const { error: accessError } = await adminClient.from("user_lesson_access").upsert(
    {
      user_id: userId,
      module_id: module.id,
      purchase_id: purchase.id,
      source: "purchase",
      granted_at: new Date().toISOString(),
    },
    { onConflict: "user_id,module_id" }
  );

  if (accessError) {
    throw accessError;
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
        await persistModulePurchase(adminClient, session);
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
