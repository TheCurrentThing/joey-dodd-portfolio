import type { User } from "@supabase/supabase-js";
import { supabase, type Profile } from "./supabase";
import type { CommunityAuthorRole, CommunityChannel, CommunityChannelSlug, CommunityMessage } from "../types/community";

export const COMMUNITY_CHANNELS: CommunityChannel[] = [
  {
    slug: "welcome",
    label: "welcome",
    description: "Start here and get oriented.",
    mode: "static",
    readOnly: true,
    systemBody: `Welcome to DOODLES MASTER ACADEMY.

This is the member community for young artists working through the lesson library.

Start here:
1. Read the rules
2. Read how the space works
3. Say hello in introductions
4. Use studio chat for art-focused conversation

This space is for practice, encouragement, and steady growth.`,
  },
  {
    slug: "rules-and-safety",
    label: "rules-and-safety",
    description: "Behavior, privacy, and posting boundaries.",
    mode: "static",
    readOnly: true,
    systemBody: `1. Be kind and respectful.
2. Keep comments focused on art and learning.
3. No bullying, teasing, rude jokes, or harassment.
4. No personal information. Use first names or nicknames only.
5. Do not share school names, addresses, phone numbers, emails, or socials.
6. Do not privately message other students through this space.
7. Keep language and uploads age-appropriate.
8. Follow moderator and instructor directions.
9. Unsafe or repeated disruptive behavior can lead to removal.`,
  },
  {
    slug: "how-lessons-work",
    label: "how-lessons-work",
    description: "How lessons and submissions are structured.",
    mode: "static",
    readOnly: true,
    systemBody: `Use lesson pages and lesson channels for actual assignments.

Use this community space for:
- introductions
- art questions
- encouragement
- progress check-ins

Not every message gets direct instructor feedback. The goal is a calm, useful studio, not a constant live chat.`,
  },
  {
    slug: "introductions",
    label: "introductions",
    description: "Say hello and introduce yourself.",
    mode: "chat",
    readOnly: false,
  },
  {
    slug: "studio-chat",
    label: "studio-chat",
    description: "Light art-focused conversation, questions, and encouragement.",
    mode: "chat",
    readOnly: false,
  },
  {
    slug: "hall-of-fame",
    label: "hall-of-fame",
    description: "Featured wins, highlights, and improvement moments.",
    mode: "chat",
    readOnly: true,
    adminOnlyPost: true,
  },
];

export function canAccessCommunity(profile: Profile | null, isAdmin: boolean, hasLessonsAccess: boolean) {
  return Boolean(isAdmin || profile?.is_admin || hasLessonsAccess);
}

export function getCommunityAuthorRole(isAdmin: boolean): CommunityAuthorRole {
  return isAdmin ? "instructor" : "student";
}

export function getCommunityDisplayName(user: User | null) {
  const metadataName =
    user?.user_metadata?.preferred_name ||
    user?.user_metadata?.nickname ||
    user?.user_metadata?.full_name;

  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim().slice(0, 40);
  }

  const emailPrefix = user?.email?.split("@")[0]?.trim();
  if (emailPrefix) {
    return emailPrefix.replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, 24) || "Student";
  }

  return "Student";
}

export function getCommunityChannel(slug: CommunityChannelSlug) {
  return COMMUNITY_CHANNELS.find((channel) => channel.slug === slug) ?? COMMUNITY_CHANNELS[0];
}

export async function fetchCommunityMessages(channelSlug: CommunityChannelSlug, limit = 100) {
  const { data, error } = await supabase
    .from("community_messages")
    .select("*")
    .eq("channel_slug", channelSlug)
    .order("created_at", { ascending: true })
    .limit(limit);

  return {
    data: (data as CommunityMessage[] | null) ?? [],
    error: error ? new Error(error.message) : null,
  };
}

export async function createCommunityMessage(input: {
  channelSlug: CommunityChannelSlug;
  userId: string;
  authorName: string;
  authorRole: CommunityAuthorRole;
  body: string;
}) {
  const { data, error } = await supabase
    .from("community_messages")
    .insert({
      channel_slug: input.channelSlug,
      user_id: input.userId,
      author_name: input.authorName,
      author_role: input.authorRole,
      body: input.body.trim(),
    })
    .select("*")
    .single();

  return {
    data: (data as CommunityMessage | null) ?? null,
    error: error ? new Error(error.message) : null,
  };
}

export async function deleteCommunityMessage(messageId: string) {
  const { error } = await supabase.from("community_messages").delete().eq("id", messageId);
  return { error: error ? new Error(error.message) : null };
}
