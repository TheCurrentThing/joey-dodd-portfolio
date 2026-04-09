import { supabase, SUPABASE_CONFIG_ERROR } from "./supabase";

export async function createLessonCheckoutSession(moduleId: string, returnTo?: string) {
  if (SUPABASE_CONFIG_ERROR) {
    return {
      url: null,
      error: new Error(SUPABASE_CONFIG_ERROR),
    };
  }

  if (!moduleId) {
    return {
      url: null,
      error: new Error("Missing lesson module for checkout."),
    };
  }

  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: { moduleId, returnTo },
  });

  if (error) {
    return { url: null, error };
  }

  const checkoutUrl = typeof data?.url === "string" ? data.url : null;

  if (!checkoutUrl) {
    return {
      url: null,
      error: new Error("Stripe checkout did not return a redirect URL."),
    };
  }

  return { url: checkoutUrl, error: null };
}

export async function startLessonCheckout(moduleId: string, returnTo?: string) {
  const { url, error } = await createLessonCheckoutSession(moduleId, returnTo);

  if (error || !url) {
    return { error: error ?? new Error("Missing checkout URL.") };
  }

  window.location.assign(url);
  return { error: null };
}
