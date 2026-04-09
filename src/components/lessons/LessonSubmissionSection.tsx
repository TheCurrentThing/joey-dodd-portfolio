import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle, ImageSquare, Sparkle, UploadSimple } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  createLessonSubmission,
  fetchStudentRewardSummary,
  fetchUserLessonSubmissions,
} from "../../lib/lessonSubmissions";
import type { LessonModule } from "../../types/lesson";
import type {
  LessonSubmissionStatus,
  LessonSubmissionWithAssets,
  StudentBadge,
} from "../../types/submission";
import { getCommunityDisplayName } from "../../lib/community";

const MAX_SUBMISSION_FILES = 3;

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function submissionStatusTone(status: LessonSubmissionStatus) {
  switch (status) {
    case "in_review":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "reviewed":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    case "revision_requested":
      return "border-sky-500/30 bg-sky-500/10 text-sky-200";
    case "submitted":
    default:
      return "border-border bg-neutral-900 text-neutral-300";
  }
}

export default function LessonSubmissionSection({ module }: { module: LessonModule }) {
  const { user, hasLessonsAccess, ownedLessonModuleIds, isAdmin, loading: authLoading } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [studentName, setStudentName] = useState("");
  const [studentNote, setStudentNote] = useState("");
  const [feedbackRequest, setFeedbackRequest] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submissions, setSubmissions] = useState<LessonSubmissionWithAssets[]>([]);
  const [badges, setBadges] = useState<StudentBadge[]>([]);
  const [totalStars, setTotalStars] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = Boolean(
    user && (isAdmin || hasLessonsAccess || module.is_free || ownedLessonModuleIds.includes(module.id))
  );

  useEffect(() => {
    if (!user) {
      setStudentName("");
      setSubmissions([]);
      setBadges([]);
      setTotalStars(0);
      return;
    }

    setStudentName((current) => current || getCommunityDisplayName(user));
  }, [user]);

  useEffect(() => {
    if (!user || !canSubmit) {
      setSubmissions([]);
      setBadges([]);
      setTotalStars(0);
      return;
    }

    let active = true;
    setLoading(true);

    void Promise.all([
      fetchUserLessonSubmissions(user.id, module.id),
      fetchStudentRewardSummary(user.id),
    ]).then(([submissionResult, rewardResult]) => {
      if (!active) {
        return;
      }

      if (submissionResult.error) {
        setError(submissionResult.error.message);
      } else if (rewardResult.error) {
        setError(rewardResult.error.message);
      } else {
        setSubmissions(submissionResult.data ?? []);
        setBadges(rewardResult.data?.badges ?? []);
        setTotalStars(rewardResult.data?.totalStars ?? 0);
        setError(null);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [canSubmit, module.id, user]);

  const fileNames = useMemo(() => files.map((file) => file.name), [files]);

  const handleAddFiles = (nextFiles: FileList | null) => {
    if (!nextFiles) {
      return;
    }

    const incoming = Array.from(nextFiles).filter((file) => file.type.startsWith("image/"));
    const combined = [...files, ...incoming].slice(0, MAX_SUBMISSION_FILES);
    setFiles(combined);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      return;
    }

    if (!studentName.trim()) {
      setError("Add a student name or nickname before submitting.");
      return;
    }

    if (files.length === 0) {
      setError("Upload at least one image for critique.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const { data, error: requestError } = await createLessonSubmission(user.id, {
      moduleId: module.id,
      studentName,
      studentNote,
      feedbackRequest,
      files,
    });

    setSubmitting(false);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    setSubmissions(data ?? []);

    const rewardSummary = await fetchStudentRewardSummary(user.id);
    if (!rewardSummary.error && rewardSummary.data) {
      setBadges(rewardSummary.data.badges);
      setTotalStars(rewardSummary.data.totalStars);
    }

    setStudentNote("");
    setFeedbackRequest("");
    setFiles([]);
    setSuccess("Submission received. It is now in the lesson review queue.");
  };

  return (
    <section className="rounded-2xl border border-border bg-secondary p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-300">Student Work</p>
          <h2 className="mt-3 font-serif text-h3 text-foreground">Submit your work for critique</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-300">
            Upload one to three images from this lesson. Your submission stays private between your
            family and the instructor until it is reviewed or intentionally featured later.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-neutral-950/40 px-4 py-3 text-xs text-neutral-400">
          One written critique per submission. Revision requests may come back with one focused next step.
        </div>
      </div>

      {!authLoading && !canSubmit && (
        <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-neutral-300">Critique uploads are available to lesson owners inside the portal.</p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={`/learn/login?intent=checkout&module=${encodeURIComponent(module.id)}&returnTo=${encodeURIComponent(`/learn/module/${module.slug}`)}`}
              className="inline-flex items-center gap-2 rounded-md bg-cta-primary-bg px-5 py-3 font-sans text-xs uppercase tracking-widest text-cta-primary-fg"
            >
              <Sparkle size={14} />
              Create Lesson Account
            </Link>
            <Link
              to="/learn/login"
              className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 font-sans text-xs uppercase tracking-widest text-neutral-200"
            >
              Lesson Login
            </Link>
          </div>
        </div>
      )}

      {canSubmit && (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="font-mono text-xs uppercase tracking-[0.3em] text-amber-300">
                Student Name
              </label>
              <input
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                placeholder="First name or nickname"
                className="w-full rounded-md border border-border bg-neutral-900 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-xs uppercase tracking-[0.3em] text-amber-300">
                Upload Images
              </label>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-neutral-900 px-4 py-3 font-sans text-xs uppercase tracking-widest text-neutral-200 transition-colors duration-300 hover:border-tertiary hover:text-tertiary"
              >
                <UploadSimple size={16} />
                Add up to 3 images
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  handleAddFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </div>
          </div>

          {fileNames.length > 0 && (
            <div className="rounded-xl border border-border bg-neutral-950/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400">
                Attached Images
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {fileNames.map((name, index) => (
                  <button
                    key={`${name}-${index}`}
                    type="button"
                    onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-neutral-200"
                  >
                    <ImageSquare size={12} />
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-[0.3em] text-amber-300">
              What did you try?
            </label>
            <textarea
              rows={4}
              value={studentNote}
              onChange={(event) => setStudentNote(event.target.value)}
              placeholder="What part of the lesson did you focus on? What felt hard?"
              className="w-full rounded-xl border border-border bg-neutral-900 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-[0.3em] text-amber-300">
              Feedback Request
            </label>
            <textarea
              rows={3}
              value={feedbackRequest}
              onChange={(event) => setFeedbackRequest(event.target.value)}
              placeholder="Tell the instructor what kind of help you want most."
              className="w-full rounded-xl border border-border bg-neutral-900 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-warning">{error}</p>}
          {success && (
            <p className="inline-flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle size={16} />
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-cta-primary-bg px-6 py-3 font-sans text-label uppercase tracking-widest text-cta-primary-fg transition-colors duration-300 hover:bg-tertiary disabled:opacity-60"
          >
            <UploadSimple size={16} />
            {submitting ? "Submitting..." : "Submit for Critique"}
          </button>
        </form>
      )}

      <div className="mt-10 border-t border-border pt-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-300">Your Queue</p>
          <h3 className="mt-3 font-serif text-h4 text-foreground">Past submissions for this lesson</h3>
        </div>

        {(totalStars > 0 || badges.length > 0) && (
          <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-neutral-950/40 p-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-200">Total Stars</p>
              <p className="mt-2 font-serif text-3xl text-white">{totalStars}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">Earned Badges</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge.id}
                    className="rounded-full border border-border bg-secondary px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-200"
                  >
                    {badge.badge_label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-neutral-400">Loading submissions...</p>
        ) : submissions.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border px-6 py-12 text-center text-neutral-500">
            No submissions for this lesson yet.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="rounded-2xl border border-border bg-neutral-950/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-serif text-lg text-white">{submission.student_name}</p>
                      <span
                        className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.25em] ${submissionStatusTone(submission.status)}`}
                      >
                        {submission.status.replace("_", " ")}
                      </span>
                      {submission.star_count > 0 && (
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-amber-200">
                          {submission.star_count} {submission.star_count === 1 ? "Star" : "Stars"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">
                      Submitted {formatTimestamp(submission.created_at)}
                    </p>
                  </div>
                  {submission.reviewed_at && (
                    <p className="text-xs text-neutral-400">Reviewed {formatTimestamp(submission.reviewed_at)}</p>
                  )}
                </div>

                {submission.assets.length > 0 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {submission.assets.map((asset) => (
                      <div key={asset.id} className="overflow-hidden rounded-xl border border-border bg-secondary">
                        <img
                          src={asset.signed_url}
                          alt={`${submission.student_name} submission`}
                          className="aspect-[4/3] w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {submission.student_note && (
                  <div className="mt-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">Student Note</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-200">
                      {submission.student_note}
                    </p>
                  </div>
                )}

                {submission.feedback_request && (
                  <div className="mt-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">Requested Help</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-200">
                      {submission.feedback_request}
                    </p>
                  </div>
                )}

                {submission.staff_feedback && (
                  <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-200">
                      Instructor Feedback
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-amber-50">
                      {submission.staff_feedback}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
