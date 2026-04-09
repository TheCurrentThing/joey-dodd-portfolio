export type LessonSubmissionStatus =
  | "submitted"
  | "in_review"
  | "reviewed"
  | "revision_requested";

export type LessonSubmission = {
  id: string;
  module_id: string;
  user_id: string;
  student_name: string;
  student_note: string | null;
  feedback_request: string | null;
  status: LessonSubmissionStatus;
  staff_feedback: string | null;
  featured: boolean;
  star_count: number;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LessonSubmissionAsset = {
  id: string;
  submission_id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
};

export type ResolvedLessonSubmissionAsset = LessonSubmissionAsset & {
  signed_url: string;
};

export type LessonSubmissionWithAssets = LessonSubmission & {
  assets: ResolvedLessonSubmissionAsset[];
};

export type AdminLessonSubmission = LessonSubmissionWithAssets & {
  module_title: string | null;
  module_slug: string | null;
};

export type LessonSubmissionInput = {
  moduleId: string;
  studentName: string;
  studentNote: string;
  feedbackRequest: string;
  files: File[];
};

export type StudentBadge = {
  id: string;
  user_id: string;
  badge_key: string;
  badge_label: string;
  metadata: Record<string, unknown> | null;
  awarded_at: string;
  created_at: string;
};
