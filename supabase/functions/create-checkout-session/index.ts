import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getStripeClient, requireEnv } from "../_shared/stripe.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const stripePriceId = requireEnv("STRIPE_PRICE_ID");
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header." }, { status: 401 });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "You must be signed in to start membership checkout." }, { status: 401 });
    }

    const { data: existingSubscription, error: subscriptionLookupError } = await adminClient
      .from("member_subscriptions")
      .select("stripe_customer_id, status, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionLookupError) {
      throw subscriptionLookupError;
    }

    const stillActive =
      existingSubscription &&
      ["active", "trialing"].includes(existingSubscription.status ?? "") &&
      (!existingSubscription.current_period_end ||
        new Date(existingSubscription.current_period_end).getTime() > Date.now());

    if (stillActive) {
      return jsonResponse(
        {
          error: "This account already has an active lesson membership.",
        },
        { status: 409 }
      );
    }

    const stripe = getStripeClient();

    let customerId = existingSubscription?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;

      const { error: upsertError } = await adminClient.from("member_subscriptions").upsert(
        {
          user_id: user.id,
          stripe_customer_id: customerId,
          metadata: {
            source: "checkout-session",
          },
        },
        { onConflict: "user_id" }
      );

      if (upsertError) {
        throw upsertError;
      }
    }

    const requestOrigin = request.headers.get("origin");
    const siteUrl = (Deno.env.get("SITE_URL") || requestOrigin || "http://localhost:5173").replace(/\/$/, "");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      allow_promotion_codes: true,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        supabase_user_id: user.id,
        product_area: "lessons",
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          product_area: "lessons",
        },
      },
      success_url: `${siteUrl}/learn?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/learn?billing=cancelled`,
    });

    if (!session.url) {
      throw new Error("Stripe checkout session was created without a redirect URL.");
    }

    return jsonResponse({ url: session.url });
  } catch (error) {
    console.error("create-checkout-session error", error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Failed to create checkout session.",
      },
      { status: 500 }
    );
  }
});
