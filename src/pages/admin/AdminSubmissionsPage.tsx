import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { AdminLessonSubmission, LessonSubmissionStatus } from "../../types/submission";
import { fetchAdminLessonSubmissions, updateLessonSubmissionReview } from "../../lib/lessonSubmissions";
import AdminPortalNav from "../../components/admin/AdminPortalNav";

const FILTER_OPTIONS: Array<LessonSubmissionStatus | "all"> = [
  "all",
  "submitted",
  "in_review",
  "reviewed",
  "revision_requested",
];

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusTone(status: LessonSubmissionStatus) {
  switch (status) {
    case "in_review":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "reviewed":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    case "revision_requested":
      return "border-sky-500/30 bg-sky-500/10 text-sky-200";
    default:
      return "border-border bg-neutral-900 text-neutral-300";
  }
}

function SubmissionReviewCard({
  submission,
  onSaved,
}: {
  submission: AdminLessonSubmission;
  onSaved: (nextSubmission: AdminLessonSubmission) => void;
}) {
  const [status, setStatus] = useState<LessonSubmissionStatus>(submission.status);
  const [staffFeedback, setStaffFeedback] = useState(submission.staff_feedback ?? "");
  const [featured, setFeatured] = useState(submission.featured);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(submission.status);
    setStaffFeedback(submission.staff_feedback ?? "");
    setFeatured(submission.featured);
  }, [submission]);

  return (
    <div className="rounded-2xl border border-border bg-secondary p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-h4 text-foreground">{submission.student_name}</h2>
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.25em] ${statusTone(submission.status)}`}
            >
              {submission.status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">
            {submission.module_title ?? "Lesson"} · submitted {formatTimestamp(submission.created_at)}
          </p>
        </div>
        {submission.module_slug && (
          <Link
            to={`/learn/module/${submission.module_slug}`}
            className="rounded border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-300 transition-colors duration-300 hover:border-tertiary hover:text-tertiary"
          >
            Open Lesson
          </Link>
        )}
      </div>

      {submission.assets.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {submission.assets.map((asset) => (
            <div key={asset.id} className="overflow-hidden rounded-xl border border-border bg-neutral-950/40">
              <img src={asset.signed_url} alt={submission.student_name} className="aspect-[4/3] w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {submission.student_note && (
        <div className="mt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">Student Note</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-200">
            {submission.student_note}
          </p>
        </div>
      )}

      {submission.feedback_request && (
        <div className="mt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">Requested Help</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-200">
            {submission.feedback_request}
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-300">Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as LessonSubmissionStatus)}
              className="mt-2 w-full rounded-md border border-border bg-neutral-900 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
            >
              <option value="submitted">Submitted</option>
              <option value="in_review">In Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="revision_requested">Revision Requested</option>
            </select>
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-border bg-neutral-950/40 px-4 py-3">
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
              className="h-4 w-4 rounded border-border bg-neutral-900 text-amber-500"
            />
            <span className="text-sm text-neutral-200">Mark as feature-worthy</span>
          </label>
        </div>

        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-300">Instructor Feedback</label>
          <textarea
            rows={7}
            value={staffFeedback}
            onChange={(event) => setStaffFeedback(event.target.value)}
            placeholder="Use the repeatable critique formula: what is working, one main fix, and the next practice step."
            className="mt-2 w-full rounded-xl border border-border bg-neutral-900 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-warning">{error}</p>}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-neutral-500">
          {submission.reviewed_at ? `Last reviewed ${formatTimestamp(submission.reviewed_at)}` : "Not reviewed yet"}
        </p>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            setError(null);

            const { data, error: requestError } = await updateLessonSubmissionReview({
              submissionId: submission.id,
              status,
              staffFeedback,
              featured,
            });

            setSaving(false);

            if (requestError || !data) {
              setError(requestError?.message || "Failed to save critique review.");
              return;
            }

            onSaved({
              ...submission,
              ...data,
            });
          }}
          className="rounded-md bg-cta-primary-bg px-5 py-3 font-sans text-xs uppercase tracking-widest text-cta-primary-fg transition-colors duration-300 hover:bg-tertiary disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Review"}
        </button>
      </div>
    </div>
  );
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<AdminLessonSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LessonSubmissionStatus | "all">("all");

  useEffect(() => {
    let active = true;
    setLoading(true);

    void fetchAdminLessonSubmissions(filter).then(({ data, error: requestError }) => {
      if (!active) {
        return;
      }

      if (requestError) {
        setError(requestError.message);
      } else {
        setSubmissions(data ?? []);
        setError(null);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [filter]);

  const summary = useMemo(() => {
    return submissions.reduce(
      (accumulator, submission) => {
        accumulator[submission.status] += 1;
        return accumulator;
      },
      {
        submitted: 0,
        in_review: 0,
        reviewed: 0,
        revision_requested: 0,
      } satisfies Record<LessonSubmissionStatus, number>
    );
  }, [submissions]);

  return (
    <div className="min-h-screen bg-neutral-950 pt-24 pb-24">
      <div className="mx-auto max-w-screen-xl px-6 md:px-10">
        <div className="flex flex-wrap items-start justify-between gap-4 py-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-300">Admin Panel</p>
            <h1 className="mt-3 font-serif text-4xl text-white">Critique Review Queue</h1>
            <p className="mt-3 max-w-2xl text-sm text-neutral-400">
              Review student lesson submissions, leave one clear critique, and move work through a
              calm queue instead of the public chat.
            </p>
          </div>
        </div>

        <AdminPortalNav />

        <div className="grid gap-4 rounded-2xl border border-border bg-secondary p-5 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-neutral-950/40 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">Submitted</p>
              <p className="mt-2 font-serif text-2xl text-white">{summary.submitted}</p>
            </div>
            <div className="rounded-xl border border-border bg-neutral-950/40 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">In Review</p>
              <p className="mt-2 font-serif text-2xl text-white">{summary.in_review}</p>
            </div>
            <div className="rounded-xl border border-border bg-neutral-950/40 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">Reviewed</p>
              <p className="mt-2 font-serif text-2xl text-white">{summary.reviewed}</p>
            </div>
            <div className="rounded-xl border border-border bg-neutral-950/40 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">Revision Requested</p>
              <p className="mt-2 font-serif text-2xl text-white">{summary.revision_requested}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] ${
                  filter === option
                    ? "border-tertiary bg-tertiary text-background"
                    : "border-border text-neutral-300"
                }`}
              >
                {option.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="py-16 text-center text-neutral-400">Loading submissions...</p>}
        {error && <p className="py-16 text-center text-warning">{error}</p>}

        {!loading && !error && (
          <div className="mt-6 space-y-4">
            {submissions.map((submission) => (
              <SubmissionReviewCard
                key={submission.id}
                submission={submission}
                onSaved={(nextSubmission) => {
                  setSubmissions((current) =>
                    current.map((item) => (item.id === nextSubmission.id ? nextSubmission : item))
                  );
                }}
              />
            ))}
            {submissions.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-neutral-500">
                No critique submissions match that filter.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
