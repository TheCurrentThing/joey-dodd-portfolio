import { useState } from "react";
import { Sparkle } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { startMembershipCheckout } from "../../lib/memberships";

type MembershipCheckoutButtonProps = {
  className: string;
  icon?: boolean;
  label?: string;
};

export default function MembershipCheckoutButton({
  className,
  icon = false,
  label,
}: MembershipCheckoutButtonProps) {
  const navigate = useNavigate();
  const { user, isAdmin, hasLessonsAccess } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const destination = isAdmin || hasLessonsAccess ? "/learn" : !user ? "/learn/login?intent=checkout" : null;

  const buttonLabel =
    label ??
    (isAdmin || hasLessonsAccess
      ? "Open Lesson Library"
      : user
        ? "Start Membership"
        : "Create Member Account");

  const handleClick = async () => {
    setError(null);

    if (destination) {
      navigate(destination);
      return;
    }

    setLoading(true);

    const { error: checkoutError } = await startMembershipCheckout();

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
