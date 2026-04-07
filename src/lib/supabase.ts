/// <reference types="vite/client" />

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const adminEmails =
  import.meta.env.VITE_ADMIN_EMAILS ||
  import.meta.env.NEXT_PUBLIC_ADMIN_EMAILS ||
  "joeydodd@gmail.com";
const supabaseStorageBucket =
  import.meta.env.VITE_SUPABASE_STORAGE_BUCKET ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
  "portfolio-images";
const lessonCoverBucket =
  import.meta.env.VITE_SUPABASE_LESSON_COVER_BUCKET || "lesson-covers";
const lessonPublicMediaBucket =
  import.meta.env.VITE_SUPABASE_LESSON_PUBLIC_MEDIA_BUCKET || "lesson-public-media";
const lessonPrivateMediaBucket =
  import.meta.env.VITE_SUPABASE_LESSON_PRIVATE_MEDIA_BUCKET || "lesson-private-media";
const lessonPrivateResourceBucket =
  import.meta.env.VITE_SUPABASE_LESSON_PRIVATE_RESOURCE_BUCKET || "lesson-private-resources";

export const SUPABASE_CONFIG_ERROR =
  !supabaseUrl || !supabaseKey
    ? "Missing Supabase environment variables. Set VITE_SUPABASE_URL and either VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY."
    : null;

export const supabase = createClient(
  supabaseUrl || "https://placeholder.invalid",
  supabaseKey || "missing-key"
);

export const ADMIN_EMAILS = adminEmails
  .split(",")
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

export const STORAGE_BUCKET = supabaseStorageBucket;
export const LESSON_COVER_BUCKET = lessonCoverBucket;
export const LESSON_PUBLIC_MEDIA_BUCKET = lessonPublicMediaBucket;
export const LESSON_PRIVATE_MEDIA_BUCKET = lessonPrivateMediaBucket;
export const LESSON_PRIVATE_RESOURCE_BUCKET = lessonPrivateResourceBucket;

export type Profile = {
  id: string;
  is_admin: boolean;
  has_lessons_access: boolean;
  created_at?: string;
  updated_at?: string;
};

export function isAllowedAdminEmail(email?: string | null) {
  return !!email && ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

// Auth helpers
export const auth = {
  signIn: async (email: string, password: string) => {
    if (SUPABASE_CONFIG_ERROR) {
      return {
        data: null,
        error: new Error(SUPABASE_CONFIG_ERROR),
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signInMember: async (email: string, password: string) => {
    if (SUPABASE_CONFIG_ERROR) {
      return {
        data: null,
        error: new Error(SUPABASE_CONFIG_ERROR),
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    if (SUPABASE_CONFIG_ERROR) {
      return { error: new Error(SUPABASE_CONFIG_ERROR) };
    }

    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getUser: async () => {
    if (SUPABASE_CONFIG_ERROR) {
      return { user: null, error: new Error(SUPABASE_CONFIG_ERROR) };
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  getProfile: async (userId: string) => {
    if (SUPABASE_CONFIG_ERROR) {
      return {
        profile: null,
        error: new Error(SUPABASE_CONFIG_ERROR),
      };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    return { profile: (data as Profile | null) ?? null, error };
  },

  ensureProfile: async (userId: string) => {
    if (SUPABASE_CONFIG_ERROR) {
      return {
        profile: null,
        error: new Error(SUPABASE_CONFIG_ERROR),
      };
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: userId }, { onConflict: "id" })
      .select("*")
      .single();

    return { profile: (data as Profile | null) ?? null, error };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    if (SUPABASE_CONFIG_ERROR) {
      return {
        data: {
          subscription: {
            unsubscribe() {},
          },
        },
      };
    }

    return supabase.auth.onAuthStateChange(callback);
  },
};
