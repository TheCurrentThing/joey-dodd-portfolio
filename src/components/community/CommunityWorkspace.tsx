import { useEffect, useMemo, useState } from "react";
import { ArrowSquareOut, ShieldCheck, TrashSimple } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { canAccessCommunity, COMMUNITY_CHANNELS, createCommunityMessage, deleteCommunityMessage, fetchCommunityMessages, getCommunityAuthorRole, getCommunityChannel, getCommunityDisplayName } from "../../lib/community";
import type { CommunityChannel, CommunityChannelSlug, CommunityMessage } from "../../types/community";
import { useAuth } from "../../hooks/useAuth";
import AdminPortalNav from "../admin/AdminPortalNav";

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ChannelButton({
  channel,
  active,
  onClick,
}: {
  channel: CommunityChannel;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3 text-left transition-colors duration-300 ${
        active
          ? "border-tertiary bg-tertiary text-background"
          : "border-border bg-secondary text-neutral-200 hover:border-tertiary hover:text-tertiary"
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.25em]">#{channel.label}</p>
      <p className={`mt-2 text-xs leading-relaxed ${active ? "text-background/80" : "text-neutral-400"}`}>
        {channel.description}
      </p>
    </button>
  );
}

export default function CommunityWorkspace({
  mode,
}: {
  mode: "member" | "admin";
}) {
  const { user, profile, isAdmin, hasLessonsAccess, loading: authLoading } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<CommunityChannelSlug>("welcome");
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [posting, setPosting] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const activeChannel = getCommunityChannel(selectedChannel);
  const hasAccess = canAccessCommunity(profile, isAdmin, hasLessonsAccess);
  const canPost =
    activeChannel.mode === "chat" &&
    !!user &&
    (isAdmin || (!activeChannel.readOnly && !activeChannel.adminOnlyPost));

  useEffect(() => {
    if (activeChannel.mode !== "chat" || !hasAccess) {
      setMessages([]);
      return;
    }

    let active = true;

    async function loadMessages() {
      setLoadingMessages(true);
      const { data, error: requestError } = await fetchCommunityMessages(activeChannel.slug);
      if (!active) {
        return;
      }

      if (requestError) {
        setError(requestError.message);
      } else {
        setMessages(data);
        setError(null);
      }
      setLoadingMessages(false);
    }

    void loadMessages();

    return () => {
      active = false;
    };
  }, [activeChannel.mode, activeChannel.slug, hasAccess]);

  useEffect(() => {
    if (activeChannel.mode !== "chat" || !hasAccess) {
      return;
    }

    const channel = supabase
      .channel(`community:${activeChannel.slug}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_messages",
          filter: `channel_slug=eq.${activeChannel.slug}`,
        },
        (payload) => {
          setMessages((current) => {
            const nextMessage = payload.new as CommunityMessage;
            if (current.some((message) => message.id === nextMessage.id)) {
              return current;
            }

            return [...current, nextMessage];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "community_messages",
          filter: `channel_slug=eq.${activeChannel.slug}`,
        },
        (payload) => {
          const deleted = payload.old as CommunityMessage;
          setMessages((current) => current.filter((message) => message.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeChannel.mode, activeChannel.slug, hasAccess]);

  const title = mode === "admin" ? "Community Control" : "Community Studio";
  const subtitle =
    mode === "admin"
      ? "Moderate the in-site student chat, review message flow, and keep the room calm."
      : "A light, moderated chat space for lesson members to encourage each other and ask art questions.";

  const emptyMessage = useMemo(() => {
    if (activeChannel.slug === "hall-of-fame") {
      return "No highlights have been posted yet.";
    }

    return "No messages yet. Start the room with a clear, useful post.";
  }, [activeChannel.slug]);

  if (authLoading) {
    return <div className="min-h-screen bg-background pt-24 text-center text-neutral-400">Loading community...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:px-10">
          <h1 className="font-serif text-4xl text-white">Community Studio</h1>
          <p className="mt-4 text-neutral-300">Sign in as a lesson member to access the chat room.</p>
          <Link
            to="/learn/login"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-amber-600 px-6 py-3 font-sans text-xs uppercase tracking-widest text-white transition-colors duration-300 hover:bg-amber-500"
          >
            Member Lesson Login
          </Link>
        </div>
      </div>
    );
  }

  if (!hasAccess && !isAdmin) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24">
        <div className="mx-auto max-w-3xl px-6 py-16 md:px-10">
          <div className="rounded-2xl border border-border bg-secondary p-8 text-center">
            <ShieldCheck size={28} className="mx-auto text-amber-300" />
            <h1 className="mt-4 font-serif text-4xl text-white">Community access is member-only</h1>
            <p className="mt-4 text-neutral-300">
              This in-site chat room is available to lesson members and admins so moderation stays
              controlled and parent-safe.
            </p>
            <Link
              to="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-amber-600 px-6 py-3 font-sans text-xs uppercase tracking-widest text-white transition-colors duration-300 hover:bg-amber-500"
            >
              Ask About Access
              <ArrowSquareOut size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-24">
      <div className="mx-auto max-w-screen-xl px-6 md:px-10">
        <div className="flex flex-wrap items-start justify-between gap-4 py-10">
          <div>
            <Link
              to={mode === "admin" ? "/admin" : "/learn"}
              className="font-mono text-xs uppercase tracking-[0.35em] text-neutral-500 transition-colors duration-300 hover:text-tertiary"
            >
              {mode === "admin" ? "Back to Admin" : "Back to Learn"}
            </Link>
            <h1 className="mt-3 font-serif text-4xl text-white">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm text-neutral-400">{subtitle}</p>
          </div>
        </div>

        {mode === "admin" && <AdminPortalNav />}

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-border bg-secondary p-4">
            <p className="px-2 font-mono text-xs uppercase tracking-[0.35em] text-amber-300">Channels</p>
            <div className="mt-4 space-y-2">
              {COMMUNITY_CHANNELS.map((channel) => (
                <ChannelButton
                  key={channel.slug}
                  channel={channel}
                  active={selectedChannel === channel.slug}
                  onClick={() => setSelectedChannel(channel.slug)}
                />
              ))}
            </div>
          </aside>

          <section className="rounded-2xl border border-border bg-secondary">
            <div className="border-b border-border px-6 py-5">
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-300">#{activeChannel.label}</p>
              <p className="mt-2 text-sm text-neutral-400">{activeChannel.description}</p>
            </div>

            {activeChannel.mode === "static" ? (
              <div className="p-6">
                <div className="rounded-2xl border border-border bg-neutral-950/50 p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-200">
                    {activeChannel.systemBody}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[38rem] flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
                  {loadingMessages ? (
                    <p className="text-center text-neutral-400">Loading messages...</p>
                  ) : messages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-neutral-500">
                      {emptyMessage}
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="rounded-2xl border border-border bg-neutral-950/50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-serif text-lg text-white">{message.author_name}</p>
                              <span
                                className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.25em] ${
                                  message.author_role === "instructor"
                                    ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                                    : "border-border text-neutral-400"
                                }`}
                              >
                                {message.author_role === "instructor" ? "Instructor" : "Student"}
                              </span>
                              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">
                                {formatTimestamp(message.created_at)}
                              </span>
                            </div>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-200">
                              {message.body}
                            </p>
                          </div>

                          {mode === "admin" && (
                            <button
                              type="button"
                              onClick={async () => {
                                const { error: deleteError } = await deleteCommunityMessage(message.id);
                                if (deleteError) {
                                  setError(deleteError.message);
                                  return;
                                }

                                setMessages((current) => current.filter((item) => item.id !== message.id));
                              }}
                              className="rounded border border-red-500/30 px-3 py-2 text-red-300 transition-colors duration-300 hover:bg-red-500/10"
                              title="Delete message"
                            >
                              <TrashSimple size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {error && (
                  <div className="border-t border-red-500/20 bg-red-950/20 px-6 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <div className="border-t border-border px-6 py-5">
                  {canPost || (mode === "admin" && activeChannel.mode === "chat") ? (
                    <form
                      onSubmit={async (event) => {
                        event.preventDefault();
                        if (!user || !body.trim()) {
                          return;
                        }

                        setPosting(true);
                        setError(null);

                        const { error: createError } = await createCommunityMessage({
                          channelSlug: activeChannel.slug,
                          userId: user.id,
                          authorName: getCommunityDisplayName(user),
                          authorRole: getCommunityAuthorRole(isAdmin),
                          body,
                        });

                        setPosting(false);

                        if (createError) {
                          setError(createError.message);
                          return;
                        }

                        setBody("");
                      }}
                      className="space-y-3"
                    >
                      <textarea
                        rows={4}
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        placeholder={
                          activeChannel.slug === "hall-of-fame"
                            ? "Post a featured win, improvement highlight, or staff announcement..."
                            : "Write a message that helps keep the room useful and encouraging..."
                        }
                        className="w-full rounded-xl border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-neutral-500">
                          {activeChannel.slug === "studio-chat"
                            ? "Keep it art-focused, kind, and easy to scan."
                            : "Short, clear messages work best."}
                        </p>
                        <button
                          type="submit"
                          disabled={posting || !body.trim()}
                          className="rounded-md bg-amber-600 px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-white transition-colors duration-300 hover:bg-amber-500 disabled:opacity-50"
                        >
                          {posting ? "Posting..." : "Send Message"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-neutral-500">
                      {activeChannel.readOnly
                        ? "This channel is read-only for students."
                        : "Message posting is disabled here."}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
