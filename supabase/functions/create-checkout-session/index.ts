import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getStripeClient, requireEnv } from "../_shared/stripe.ts";

type CheckoutRequest = {
  moduleId?: string;
  returnTo?: string;
};

function sanitizeReturnPath(value: string | undefined, fallbackPath: string) {
  if (!value || !value.startsWith("/")) {
    return fallbackPath;
  }

  return value;
}

function appendBillingState(siteUrl: string, path: string, billingState: "success" | "cancelled") {
  const url = new URL(path, siteUrl);
  url.searchParams.set("billing", billingState);

  if (billingState === "success") {
    url.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
  }

  return url.toString();
}

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
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header." }, { status: 401 });
    }

    const body = (await request.json()) as CheckoutRequest;
    const moduleId = typeof body.moduleId === "string" ? body.moduleId : "";

    if (!moduleId) {
      return jsonResponse({ error: "Missing lesson module." }, { status: 400 });
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
      return jsonResponse({ error: "You must be signed in to purchase a lesson module." }, { status: 401 });
    }

    const [{ data: module, error: moduleError }, { data: profile, error: profileError }] = await Promise.all([
      adminClient
        .from("lesson_modules")
        .select("id, title, slug, is_free, is_published, stripe_price_id, price_cents")
        .eq("id", moduleId)
        .maybeSingle(),
      adminClient.from("profiles").select("has_lessons_access").eq("id", user.id).maybeSingle(),
    ]);

    if (moduleError) {
      throw moduleError;
    }

    if (profileError) {
      throw profileError;
    }

    if (!module || !module.is_published) {
      return jsonResponse({ error: "This lesson module is not available for purchase." }, { status: 404 });
    }

    if (module.is_free) {
      return jsonResponse({ error: "This lesson is already free to preview." }, { status: 409 });
    }

    if (!module.stripe_price_id) {
      return jsonResponse({ error: "This lesson does not have Stripe pricing configured yet." }, { status: 409 });
    }

    const { data: existingAccess, error: accessError } = await adminClient
      .from("user_lesson_access")
      .select("module_id")
      .eq("user_id", user.id)
      .eq("module_id", module.id)
      .maybeSingle();

    if (accessError) {
      throw accessError;
    }

    if (profile?.has_lessons_access || existingAccess) {
      return jsonResponse(
        {
          error: "This account already has access to that lesson.",
        },
        { status: 409 }
      );
    }

    const stripe = getStripeClient();

    const { data: previousPurchase, error: purchaseLookupError } = await adminClient
      .from("lesson_module_purchases")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (purchaseLookupError) {
      throw purchaseLookupError;
    }

    let customerId = previousPurchase?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;
    }

    const requestOrigin = request.headers.get("origin");
    const siteUrl = (Deno.env.get("SITE_URL") || requestOrigin || "http://localhost:5173").replace(/\/$/, "");
    const returnPath = sanitizeReturnPath(body.returnTo, `/learn/module/${module.slug}`);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      client_reference_id: user.id,
      allow_promotion_codes: true,
      line_items: [
        {
          price: module.stripe_price_id,
          quantity: 1,
        },
      ],
      metadata: {
        supabase_user_id: user.id,
        module_id: module.id,
        module_slug: module.slug,
        product_area: "lessons",
      },
      success_url: appendBillingState(siteUrl, returnPath, "success"),
      cancel_url: appendBillingState(siteUrl, returnPath, "cancelled"),
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
