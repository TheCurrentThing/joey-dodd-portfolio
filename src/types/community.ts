export type CommunityChannelSlug =
  | "welcome"
  | "rules-and-safety"
  | "how-lessons-work"
  | "introductions"
  | "studio-chat"
  | "hall-of-fame";

export type CommunityChannelMode = "static" | "chat";

export type CommunityChannel = {
  slug: CommunityChannelSlug;
  label: string;
  description: string;
  mode: CommunityChannelMode;
  readOnly: boolean;
  adminOnlyPost?: boolean;
  systemBody?: string;
};

export type CommunityAuthorRole = "instructor" | "student";

export type CommunityMessage = {
  id: string;
  channel_slug: CommunityChannelSlug;
  user_id: string;
  author_name: string;
  author_role: CommunityAuthorRole;
  body: string;
  created_at: string;
  updated_at: string;
};
