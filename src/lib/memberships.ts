import { supabase, SUPABASE_CONFIG_ERROR } from "./supabase";

export async function createMembershipCheckoutSession() {
  if (SUPABASE_CONFIG_ERROR) {
    return {
      url: null,
      error: new Error(SUPABASE_CONFIG_ERROR),
    };
  }

  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: {},
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

export async function startMembershipCheckout() {
  const { url, error } = await createMembershipCheckoutSession();

  if (error || !url) {
    return { error: error ?? new Error("Missing checkout URL.") };
  }

  window.location.assign(url);
  return { error: null };
}
