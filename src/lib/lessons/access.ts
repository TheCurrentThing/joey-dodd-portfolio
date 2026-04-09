import type { LessonModule } from "../../types/lesson";
import type { Profile } from "../supabase";

export function isLessonLocked(
  module: Pick<LessonModule, "is_free">,
  options: {
    isAdmin: boolean;
    hasModuleAccess: boolean;
  }
) {
  if (options.isAdmin || module.is_free) {
    return false;
  }

  return !options.hasModuleAccess;
}

export function canManageLessons(profile: Profile | null, allowlistAdmin: boolean) {
  return Boolean(profile?.is_admin || allowlistAdmin);
}
