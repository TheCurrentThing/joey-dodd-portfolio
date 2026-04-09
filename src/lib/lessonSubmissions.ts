import { createSignedAssetUrl, uploadBucketFile } from "./storage";
import { LESSON_SUBMISSION_BUCKET, supabase } from "./supabase";
import type {
  AdminLessonSubmission,
  LessonSubmission,
  LessonSubmissionAsset,
  LessonSubmissionInput,
  LessonSubmissionStatus,
  LessonSubmissionWithAssets,
  ResolvedLessonSubmissionAsset,
} from "../types/submission";

function normalizeSubmissionName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Student";
  }

  return trimmed.slice(0, 60);
}

async function resolveSubmissionAssets(
  assets: LessonSubmissionAsset[]
): Promise<ResolvedLessonSubmissionAsset[]> {
  const resolved = await Promise.all(
    assets.map(async (asset) => {
      const { url } = await createSignedAssetUrl(LESSON_SUBMISSION_BUCKET, asset.storage_path, 60 * 60);

      return {
        ...asset,
        signed_url: url ?? "",
      };
    })
  );

  return resolved.filter((asset) => asset.signed_url);
}

async function fetchAssetsForSubmissionIds(submissionIds: string[]) {
  if (submissionIds.length === 0) {
    return {
      data: [] as LessonSubmissionAsset[],
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("lesson_submission_assets")
    .select("*")
    .in("submission_id", submissionIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return {
    data: (data as LessonSubmissionAsset[] | null) ?? [],
    error: error ? new Error(error.message) : null,
  };
}

export async function createLessonSubmission(userId: string, input: LessonSubmissionInput) {
  const trimmedNote = input.studentNote.trim();
  const trimmedRequest = input.feedbackRequest.trim();

  const { data: submission, error: submissionError } = await supabase
    .from("lesson_submissions")
    .insert({
      module_id: input.moduleId,
      user_id: userId,
      student_name: normalizeSubmissionName(input.studentName),
      student_note: trimmedNote || null,
      feedback_request: trimmedRequest || null,
      status: "submitted",
    })
    .select("*")
    .single();

  if (submissionError || !submission) {
    return {
      data: null,
      error: new Error(submissionError?.message || "Failed to create submission."),
    };
  }

  const uploadedAssets: { storage_path: string; sort_order: number }[] = [];

  for (let index = 0; index < input.files.length; index += 1) {
    const file = input.files[index];
    const uploadResult = await uploadBucketFile(
      file,
      LESSON_SUBMISSION_BUCKET,
      `${userId}/${input.moduleId}/${submission.id}`
    );

    if (!uploadResult.success) {
      return {
        data: null,
        error: new Error(uploadResult.error),
      };
    }

    uploadedAssets.push({
      storage_path: uploadResult.path,
      sort_order: index,
    });
  }

  const { error: assetInsertError } = await supabase.from("lesson_submission_assets").insert(
    uploadedAssets.map((asset) => ({
      submission_id: submission.id,
      storage_path: asset.storage_path,
      sort_order: asset.sort_order,
    }))
  );

  if (assetInsertError) {
    return {
      data: null,
      error: new Error(assetInsertError.message),
    };
  }

  return fetchUserLessonSubmissions(userId, input.moduleId);
}

export async function fetchUserLessonSubmissions(userId: string, moduleId: string) {
  const { data: submissions, error } = await supabase
    .from("lesson_submissions")
    .select("*")
    .eq("user_id", userId)
    .eq("module_id", moduleId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: new Error(error.message),
    };
  }

  const typedSubmissions = (submissions as LessonSubmission[] | null) ?? [];
  const submissionIds = typedSubmissions.map((submission) => submission.id);
  const { data: assets, error: assetError } = await fetchAssetsForSubmissionIds(submissionIds);

  if (assetError) {
    return {
      data: null,
      error: assetError,
    };
  }

  const assetsBySubmission = new Map<string, LessonSubmissionAsset[]>();
  for (const asset of assets) {
    const current = assetsBySubmission.get(asset.submission_id) ?? [];
    current.push(asset);
    assetsBySubmission.set(asset.submission_id, current);
  }

  const resolvedSubmissions = await Promise.all(
    typedSubmissions.map(async (submission) => ({
      ...submission,
      assets: await resolveSubmissionAssets(assetsBySubmission.get(submission.id) ?? []),
    }))
  );

  return {
    data: resolvedSubmissions as LessonSubmissionWithAssets[],
    error: null,
  };
}

type AdminSubmissionRow = LessonSubmission & {
  lesson_modules: {
    title: string;
    slug: string;
  } | null;
};

export async function fetchAdminLessonSubmissions(status?: LessonSubmissionStatus | "all") {
  let query = supabase
    .from("lesson_submissions")
    .select("*, lesson_modules(title, slug)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: new Error(error.message),
    };
  }

  const rows = ((data as AdminSubmissionRow[] | null) ?? []).map((row) => ({
    ...row,
    module_title: row.lesson_modules?.title ?? null,
    module_slug: row.lesson_modules?.slug ?? null,
  }));

  const submissionIds = rows.map((row) => row.id);
  const { data: assets, error: assetError } = await fetchAssetsForSubmissionIds(submissionIds);

  if (assetError) {
    return {
      data: null,
      error: assetError,
    };
  }

  const assetsBySubmission = new Map<string, LessonSubmissionAsset[]>();
  for (const asset of assets) {
    const current = assetsBySubmission.get(asset.submission_id) ?? [];
    current.push(asset);
    assetsBySubmission.set(asset.submission_id, current);
  }

  const resolved = await Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      module_id: row.module_id,
      user_id: row.user_id,
      student_name: row.student_name,
      student_note: row.student_note,
      feedback_request: row.feedback_request,
      status: row.status,
      staff_feedback: row.staff_feedback,
      featured: row.featured,
      reviewed_at: row.reviewed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      module_title: row.module_title,
      module_slug: row.module_slug,
      assets: await resolveSubmissionAssets(assetsBySubmission.get(row.id) ?? []),
    }))
  );

  return {
    data: resolved as AdminLessonSubmission[],
    error: null,
  };
}

export async function updateLessonSubmissionReview(input: {
  submissionId: string;
  status: LessonSubmissionStatus;
  staffFeedback: string;
  featured: boolean;
}) {
  const nextReviewedAt =
    input.status === "reviewed" || input.status === "revision_requested"
      ? new Date().toISOString()
      : null;

  const { data, error } = await supabase
    .from("lesson_submissions")
    .update({
      status: input.status,
      staff_feedback: input.staffFeedback.trim() || null,
      featured: input.featured,
      reviewed_at: nextReviewedAt,
    })
    .eq("id", input.submissionId)
    .select("*")
    .single();

  return {
    data: (data as LessonSubmission | null) ?? null,
    error: error ? new Error(error.message) : null,
  };
}
