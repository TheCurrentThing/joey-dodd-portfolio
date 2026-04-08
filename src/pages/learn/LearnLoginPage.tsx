import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { startMembershipCheckout } from "../../lib/memberships";

export default function LearnLoginPage() {
  const { user, hasLessonsAccess, signInMember, signUpMember, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const checkoutIntent = searchParams.get("intent") === "checkout";
  const initialMode = useMemo(() => (checkoutIntent ? "signup" : "signin"), [checkoutIntent]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  if (user && (hasLessonsAccess || isAdmin)) {
    return <Navigate to={(location.state as { from?: string } | null)?.from || "/learn"} replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    if (mode === "signin") {
      const { error: requestError } = await signInMember(email, password);

      if (requestError) {
        setError(requestError.message);
      } else if (checkoutIntent) {
        const { error: checkoutError } = await startMembershipCheckout();

        if (checkoutError) {
          setError(checkoutError.message);
        }
      } else {
        navigate("/learn");
      }
    } else {
      const { data, error: requestError } = await signUpMember(email, password);

      if (requestError) {
        setError(requestError.message);
      } else if (data?.session && checkoutIntent) {
        const { error: checkoutError } = await startMembershipCheckout();

        if (checkoutError) {
          setError(checkoutError.message);
        }
      } else if (data?.session) {
        navigate("/learn");
      } else {
        setNotice(
          "Your account was created. Check your email to confirm your address, then sign in to continue."
        );
        setMode("signin");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background px-6 pt-28 pb-20">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-secondary p-8">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-tertiary">Lesson Member Login</p>
        <h1 className="mt-4 font-serif text-h2 text-foreground">
          {mode === "signin" ? "Sign in for art lesson access" : "Create your lesson member account"}
        </h1>
        <p className="mt-3 font-sans text-body-lg font-light leading-relaxed text-neutral-300">
          This sign-in is for lesson members, parents, and students with library access. Site and
          portfolio administration uses the separate admin login.
        </p>
        {checkoutIntent && (
          <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            You&apos;re starting a paid lesson membership. Sign in or create an account first so
            Stripe can attach the subscription to your lesson library access.
          </p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-border bg-neutral-950/50 p-1">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`rounded-lg px-4 py-2 text-sm uppercase tracking-[0.25em] transition-colors ${
              mode === "signin"
                ? "bg-cta-primary-bg text-cta-primary-fg"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-lg px-4 py-2 text-sm uppercase tracking-[0.25em] transition-colors ${
              mode === "signup"
                ? "bg-cta-primary-bg text-cta-primary-fg"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Create Account
          </button>
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-[0.3em] text-amber-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-border bg-neutral-900 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-[0.3em] text-amber-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-border bg-neutral-900 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
            />
          </div>

          {notice && <p className="text-sm text-amber-200">{notice}</p>}
          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-cta-primary-bg px-5 py-3 font-sans text-label uppercase tracking-widest text-cta-primary-fg transition-colors duration-300 hover:bg-tertiary disabled:opacity-60"
          >
            {loading
              ? mode === "signin"
                ? "Signing In..."
                : "Creating Account..."
              : mode === "signin"
                ? "Enter Lesson Library"
                : "Create Member Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
