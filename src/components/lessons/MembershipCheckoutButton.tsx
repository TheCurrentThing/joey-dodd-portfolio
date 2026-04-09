import { useState } from "react";
import { Sparkle } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { startLessonCheckout } from "../../lib/memberships";

type MembershipCheckoutButtonProps = {
  className: string;
  icon?: boolean;
  label?: string;
  moduleId?: string | null;
  returnTo?: string;
};

export default function MembershipCheckoutButton({
  className,
  icon = false,
  label,
  moduleId,
  returnTo,
}: MembershipCheckoutButtonProps) {
  const navigate = useNavigate();
  const { user, isAdmin, hasLessonsAccess, ownedLessonModuleIds } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasModuleAccess = Boolean(
    moduleId && (isAdmin || hasLessonsAccess || ownedLessonModuleIds.includes(moduleId))
  );
  const destination = hasModuleAccess
    ? returnTo || "/learn"
    : !user
      ? moduleId
        ? `/learn/login?intent=checkout&module=${encodeURIComponent(moduleId)}${
            returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
          }`
        : "/learn/login"
      : !moduleId
        ? "/learn#lesson-library"
        : null;

  const buttonLabel =
    label ??
    (hasModuleAccess
      ? "Open Lesson"
      : user
        ? "Get This Module"
        : "Create Lesson Account");

  const handleClick = async () => {
    setError(null);

    if (destination) {
      navigate(destination);
      return;
    }

    setLoading(true);

    const { error: checkoutError } = await startLessonCheckout(moduleId!, returnTo);

    if (checkoutError) {
      setError(checkoutError.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {destination ? (
        <Link to={destination} className={className}>
          {icon && <Sparkle size={16} />}
          {buttonLabel}
        </Link>
      ) : (
        <button type="button" onClick={handleClick} disabled={loading} className={className}>
          {icon && <Sparkle size={16} />}
          {loading ? "Redirecting..." : buttonLabel}
        </button>
      )}
      {error && <p className="max-w-sm text-sm text-warning">{error}</p>}
    </div>
  );
}
