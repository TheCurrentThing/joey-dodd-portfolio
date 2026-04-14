import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowSquareOut, ShieldCheck, TrashSimple } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  COMMUNITY_CHANNELS,
  canAccessCommunity,
  createCommunityMessage,
  deleteCommunityMessage,
  fetchCommunityMessages,
  getCommunityAuthorRole,
  getCommunityChannel,
  getCommunityDisplayName,
} from "../../lib/community";
import type { CommunityAuthorRole, CommunityChannelSlug, CommunityMessage } from "../../types/community";
import { useAuth } from "../../hooks/useAuth";
import AdminPortalNav from "../admin/AdminPortalNav";

type Reaction = { emoji: string; count: number; reacted: boolean };
type Participant = { id: string; name: string; role: CommunityAuthorRole; status: "online" | "recent" };

const REACTIONS = ["👍", "❤️", "🔥", "😂", "🎨", "💡", "👏", "✨"];

function formatTimestamp(value: string, compact = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const now = new Date();
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (compact) return time;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return `Today at ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday at ${time}`;
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "ST";
}

function AvatarBubble({
  name,
  role,
  size = "md",
}: {
  name: string;
  role: CommunityAuthorRole;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const tone = role === "instructor" ? "bg-amber-500 text-black" : "bg-indigo-600 text-white";
  return (
    <div className={`flex ${sizeClass} items-center justify-center rounded-full font-bold ${tone}`}>
      {getInitials(name)}
    </div>
  );
}

export default function CommunityWorkspace({ mode }: { mode: "member" | "admin" }) {
  const { user, profile, isAdmin, hasLessonsAccess, ownedLessonModuleIds, loading: authLoading } = useAuth();
  const adminView = mode === "admin";
  const canModerate = adminView || isAdmin;
  const [selectedChannel, setSelectedChannel] = useState<CommunityChannelSlug>("welcome");
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [body, setBody] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const feedEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const channel = getCommunityChannel(selectedChannel);
  const hasAccess = canAccessCommunity(profile, canModerate, hasLessonsAccess, ownedLessonModuleIds);
  const canPost = channel.mode === "chat" && !!user && (canModerate || (!channel.readOnly && !channel.adminOnlyPost));
  const infoChannels = COMMUNITY_CHANNELS.filter((entry) => entry.mode === "static");
  const chatChannels = COMMUNITY_CHANNELS.filter((entry) => entry.mode === "chat");

  useEffect(() => {
    setBody("");
    setError(null);
  }, [selectedChannel]);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }, [body, selectedChannel]);

  useEffect(() => {
    if (channel.mode !== "chat" || !hasAccess) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }
    let active = true;
    async function loadMessages() {
      setLoadingMessages(true);
      const { data, error: requestError } = await fetchCommunityMessages(channel.slug);
      if (!active) return;
      if (requestError) {
        setMessages([]);
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
  }, [channel.mode, channel.slug, hasAccess]);

  useEffect(() => {
    if (channel.mode !== "chat" || !hasAccess) return;
    const subscription = supabase
      .channel(`community:${channel.slug}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages", filter: `channel_slug=eq.${channel.slug}` },
        (payload) => {
          const nextMessage = payload.new as CommunityMessage;
          setMessages((current) => (current.some((entry) => entry.id === nextMessage.id) ? current : [...current, nextMessage]));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "community_messages", filter: `channel_slug=eq.${channel.slug}` },
        (payload) => {
          const deleted = payload.old as CommunityMessage;
          setMessages((current) => current.filter((entry) => entry.id !== deleted.id));
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(subscription);
    };
  }, [channel.mode, channel.slug, hasAccess]);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, selectedChannel]);

  const groupedMessages = useMemo(
    () =>
      messages.map((message, index) => ({
        ...message,
        grouped:
          index > 0 &&
          messages[index - 1].author_name === message.author_name &&
          messages[index - 1].author_role === message.author_role,
      })),
    [messages]
  );

  const participants = useMemo<Participant[]>(() => {
    const next = new Map<string, Participant>();
    for (const message of [...messages].reverse()) {
      if (!next.has(message.user_id)) {
        next.set(message.user_id, {
          id: message.user_id,
          name: message.author_name,
          role: message.author_role,
          status: "recent",
        });
      }
    }
    if (user) {
      next.set(user.id, {
        id: user.id,
        name: getCommunityDisplayName(user),
        role: getCommunityAuthorRole(canModerate),
        status: "online",
      });
    }
    return [...next.values()].sort((a, b) => {
      if (a.status !== b.status) return a.status === "online" ? -1 : 1;
      if (a.role !== b.role) return a.role === "instructor" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [canModerate, messages, user]);

  async function handlePost(event?: FormEvent) {
    event?.preventDefault();
    if (!user || !body.trim() || !canPost) return;
    setPosting(true);
    setError(null);
    const { error: createError } = await createCommunityMessage({
      channelSlug: channel.slug,
      userId: user.id,
      authorName: getCommunityDisplayName(user),
      authorRole: getCommunityAuthorRole(canModerate),
      body,
    });
    setPosting(false);
    if (createError) {
      setError(createError.message);
      return;
    }
    setBody("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handlePost();
    }
  }

  function toggleReaction(messageId: string, emoji: string) {
    setReactions((current) => {
      const existing = current[messageId] ?? [];
      const found = existing.find((entry) => entry.emoji === emoji);
      if (!found) return { ...current, [messageId]: [...existing, { emoji, count: 1, reacted: true }] };
      return {
        ...current,
        [messageId]: existing
          .map((entry) =>
            entry.emoji === emoji
              ? { ...entry, count: entry.reacted ? entry.count - 1 : entry.count + 1, reacted: !entry.reacted }
              : entry
          )
          .filter((entry) => entry.count > 0),
      };
    });
  }

  function addReaction(messageId: string) {
    toggleReaction(messageId, REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);
  }

  async function handleDelete(messageId: string) {
    if (!canModerate) return;
    const { error: deleteError } = await deleteCommunityMessage(messageId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setMessages((current) => current.filter((entry) => entry.id !== messageId));
  }

  if (authLoading) {
    return <div className="min-h-screen bg-background pt-24 text-center text-neutral-400">Loading community...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24">
        <div className="mx-auto max-w-4xl px-6 py-16 md:px-10">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#111113] p-8 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-300">Community Studio</p>
            <h1 className="mt-4 font-serif text-4xl text-white">Sign in as a lesson member to enter the studio.</h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/55">
              The community room stays inside the portal so moderation and lesson access stay tied to the same account.
            </p>
            <Link to="/learn/login" className="mt-8 inline-flex rounded-md bg-amber-600 px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-black transition hover:bg-amber-500">
              Member Lesson Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess && !canModerate) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24">
        <div className="mx-auto max-w-4xl px-6 py-16 md:px-10">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#111113] p-8 text-center">
            <ShieldCheck size={28} className="mx-auto text-amber-300" />
            <h1 className="mt-4 font-serif text-4xl text-white">Community access is member-only.</h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/55">
              This room is limited to lesson members and admins so the space stays moderated and family-safe.
            </p>
            <Link to="/contact" className="mt-8 inline-flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-amber-200 transition hover:bg-amber-500/20">
              Ask About Access
              <ArrowSquareOut size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-10">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to={adminView ? "/admin" : "/learn"} className="font-mono text-xs uppercase tracking-[0.35em] text-neutral-500 transition hover:text-tertiary">
              {adminView ? "Back to Admin" : "Back to Learn"}
            </Link>
            <h1 className="mt-3 font-serif text-4xl text-white">{adminView ? "Community Control" : "Community Studio"}</h1>
            <p className="mt-3 max-w-3xl text-sm text-neutral-400">
              {adminView ? "Moderate the member chat from the same portal the community already uses." : "A live, moderated studio room for lesson members to ask art questions and encourage each other."}
            </p>
          </div>
        </div>
        {adminView && <AdminPortalNav />}

        <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#111113] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="flex min-h-[42rem] flex-col lg:h-[calc(100vh-10.5rem)] lg:flex-row">
            <aside className="flex flex-col border-b border-white/10 bg-[#1a1a1f] lg:w-64 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 font-mono text-sm font-bold text-amber-300">D</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">Doodles Design School</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">{canModerate ? "Instructor Portal" : "Member Portal"}</p>
                </div>
              </div>

              <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
                {[["Info", infoChannels], ["Community", chatChannels]].map(([label, channels]) => (
                  <div key={label}>
                    <p className="mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">{label}</p>
                    <ul className="space-y-1">
                      {(channels as typeof COMMUNITY_CHANNELS).map((entry) => (
                        <li key={entry.slug}>
                          <button
                            type="button"
                            onClick={() => setSelectedChannel(entry.slug)}
                            className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${selectedChannel === entry.slug ? "bg-white/10 text-white" : "text-white/45 hover:bg-white/5 hover:text-white/80"}`}
                          >
                            <span className="font-semibold text-white/50">#</span>
                            <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                            {entry.readOnly && <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">lock</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>

              <div className="border-t border-white/10 bg-[#141418] px-3 py-3">
                <div className="flex items-center gap-2">
                  <AvatarBubble name={getCommunityDisplayName(user)} role={getCommunityAuthorRole(canModerate)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">{getCommunityDisplayName(user)}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">{canModerate ? "Instructor" : "Student"}</p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
              </div>
            </aside>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white/35">#</span>
                    <h2 className="truncate text-sm font-semibold text-white">{channel.label}</h2>
                  </div>
                  <p className="mt-1 truncate text-xs text-white/40">{channel.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {channel.readOnly && <span className="rounded bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Read only</span>}
                  <button type="button" onClick={() => setShowPanel((current) => !current)} className={`rounded p-2 text-white/45 transition hover:bg-white/10 hover:text-white ${showPanel ? "bg-white/10 text-white" : ""}`} title="Toggle side panel">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="mb-6 border-b border-white/10 pb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl font-bold text-white/35">#</div>
                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-semibold text-white">Welcome to #{channel.label}</h3>
                          <p className="text-sm text-white/40">{channel.description}</p>
                        </div>
                      </div>
                    </div>

                    {channel.mode === "static" ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-start gap-3">
                          <AvatarBubble name="Doodles Studio Guide" role="instructor" />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-sm font-semibold text-amber-300">Doodles Studio Guide</span>
                              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.25em] text-amber-300">Pinned</span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">{channel.systemBody}</p>
                          </div>
                        </div>
                      </div>
                    ) : loadingMessages ? (
                      <div className="py-20 text-center text-sm text-white/40">Loading messages...</div>
                    ) : groupedMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-white/25">
                        <div className="mb-3 text-5xl">💬</div>
                        <p className="text-sm">{channel.slug === "hall-of-fame" ? "No highlights have been posted yet." : "No messages yet. Be the first one to set the tone."}</p>
                      </div>
                    ) : (
                      groupedMessages.map((message) => (
                        <div key={message.id} className={`group relative flex gap-3 rounded-lg px-2 py-1 transition hover:bg-white/[0.03] ${message.grouped ? "mt-1" : "mt-4"}`}>
                          <div className="w-10 flex-shrink-0 pt-0.5">
                            {!message.grouped ? <AvatarBubble name={message.author_name} role={message.author_role} /> : <span className="block pt-1.5 text-right text-[10px] text-white/20 opacity-0 transition group-hover:opacity-100">{formatTimestamp(message.created_at, true)}</span>}
                          </div>
                          <div className="min-w-0 flex-1">
                            {!message.grouped && (
                              <div className="mb-1 flex flex-wrap items-baseline gap-2">
                                <span className={`text-sm font-semibold ${message.author_role === "instructor" ? "text-amber-300" : "text-white"}`}>{message.author_name}</span>
                                <span className={`rounded px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.25em] ${message.author_role === "instructor" ? "bg-amber-500/15 text-amber-300" : "bg-white/5 text-white/35"}`}>{message.author_role === "instructor" ? "Instructor" : "Student"}</span>
                                <span className="text-[11px] text-white/30">{formatTimestamp(message.created_at)}</span>
                              </div>
                            )}
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">{message.body}</p>
                            {(reactions[message.id] ?? []).length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {(reactions[message.id] ?? []).map((reaction) => (
                                  <button key={reaction.emoji} type="button" onClick={() => toggleReaction(message.id, reaction.emoji)} className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${reaction.reacted ? "border-amber-500/40 bg-amber-500/15 text-amber-200" : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"}`}>
                                    <span>{reaction.emoji}</span>
                                    <span className="font-medium">{reaction.count}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="absolute right-3 top-0 z-10 hidden -translate-y-1/2 items-center gap-1 rounded-lg border border-white/10 bg-[#1e1e24] px-1 py-0.5 shadow-xl group-hover:flex">
                            <button type="button" onClick={() => addReaction(message.id)} className="rounded p-1.5 text-sm text-white/40 transition hover:bg-white/10 hover:text-white" title="Add reaction">😄</button>
                            {canModerate && <button type="button" onClick={() => void handleDelete(message.id)} className="rounded p-1.5 text-red-300 transition hover:bg-red-500/10 hover:text-red-200" title="Delete message"><TrashSimple size={14} /></button>}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={feedEndRef} />
                  </div>

                  {error && <div className="border-t border-red-500/20 bg-red-950/20 px-4 py-3 text-sm text-red-200">{error}</div>}

                  <div className="border-t border-white/10 px-4 pb-5 pt-4">
                    {canPost ? (
                      <form onSubmit={(event) => void handlePost(event)} className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 transition focus-within:border-white/20">
                        <div className="flex items-end gap-3">
                          <AvatarBubble name={getCommunityDisplayName(user)} role={getCommunityAuthorRole(canModerate)} size="sm" />
                          <textarea
                            ref={textareaRef}
                            rows={1}
                            value={body}
                            onChange={(event) => setBody(event.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={channel.slug === "hall-of-fame" ? "Share a featured win or staff spotlight..." : channel.slug === "introductions" ? "Introduce yourself to the room..." : "Ask an art question or encourage another student..."}
                            className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-sm text-white placeholder:text-white/25 focus:outline-none"
                          />
                          <button type="submit" disabled={posting || !body.trim()} className="rounded bg-amber-500 p-2 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-30" title="Send message">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                              <line x1="22" y1="2" x2="11" y2="13" />
                              <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                          </button>
                        </div>
                        <p className="mt-2 text-right text-[10px] text-white/25">Enter to send. Shift+Enter for a new line.</p>
                      </form>
                    ) : (
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white/35">
                        {channel.readOnly ? (canModerate ? "Students cannot post in this channel. Admin can still post here." : "This channel is read-only for students.") : "Posting is disabled in this channel."}
                      </div>
                    )}
                  </div>
                </div>

                {showPanel && (
                  <aside className="border-t border-white/10 bg-[#17171b] p-3 xl:w-56 xl:border-l xl:border-t-0">
                    {channel.mode === "chat" ? (
                      <div className="space-y-4">
                        <div>
                          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">Here now</p>
                          {participants.filter((entry) => entry.status === "online").length === 0 ? <p className="text-xs text-white/30">No one currently shown.</p> : <ul className="space-y-1">{participants.filter((entry) => entry.status === "online").map((entry) => <li key={entry.id} className="flex items-center gap-2 rounded-md px-1.5 py-1.5"><div className="relative"><AvatarBubble name={entry.name} role={entry.role} size="sm" /><span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#17171b]" /></div><div className="min-w-0"><p className={`truncate text-xs font-medium ${entry.role === "instructor" ? "text-amber-300" : "text-white/75"}`}>{entry.name}</p><p className="text-[9px] uppercase tracking-[0.2em] text-white/25">{entry.role === "instructor" ? "Instructor" : "Student"}</p></div></li>)}</ul>}
                        </div>
                        <div>
                          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">Recent posters</p>
                          {participants.filter((entry) => entry.status === "recent").length === 0 ? <p className="text-xs text-white/30">No recent posts yet.</p> : <ul className="space-y-1">{participants.filter((entry) => entry.status === "recent").map((entry) => <li key={entry.id} className="flex items-center gap-2 rounded-md px-1.5 py-1.5 opacity-65"><div className="relative"><AvatarBubble name={entry.name} role={entry.role} size="sm" /><span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-[#17171b]" /></div><div className="min-w-0"><p className={`truncate text-xs font-medium ${entry.role === "instructor" ? "text-amber-300" : "text-white/75"}`}>{entry.name}</p><p className="text-[9px] uppercase tracking-[0.2em] text-white/25">{entry.role === "instructor" ? "Instructor" : "Student"}</p></div></li>)}</ul>}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">Channel</p>
                          <h3 className="mt-2 text-sm font-semibold text-white">#{channel.label}</h3>
                          <p className="mt-2 text-xs leading-relaxed text-white/45">{channel.description}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">Posting</p>
                          <p className="mt-2 text-xs leading-relaxed text-white/60">{channel.readOnly ? (canModerate ? "This room is read-only for students, but admin can still post." : "This room is read-only for students.") : "Posting is enabled here."}</p>
                        </div>
                      </div>
                    )}
                  </aside>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
