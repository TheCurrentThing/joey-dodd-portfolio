import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function LearnLoginPage() {
  const { user, hasLessonsAccess, signInMember, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user && (hasLessonsAccess || isAdmin)) {
    return <Navigate to={(location.state as { from?: string } | null)?.from || "/learn"} replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { error: requestError } = await signInMember(email, password);
    if (requestError) {
      setError(requestError.message);
    } else {
      navigate("/learn");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background px-6 pt-28 pb-20">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-secondary p-8">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-tertiary">Lesson Member Login</p>
        <h1 className="mt-4 font-serif text-h2 text-foreground">Sign in for art lesson access</h1>
        <p className="mt-3 font-sans text-body-lg font-light leading-relaxed text-neutral-300">
          This sign-in is for lesson members, parents, and students with library access. Site and
          portfolio administration uses the separate admin login.
        </p>
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

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-cta-primary-bg px-5 py-3 font-sans text-label uppercase tracking-widest text-cta-primary-fg transition-colors duration-300 hover:bg-tertiary disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Enter Lesson Library"}
          </button>
        </form>
      </div>
    </div>
  );
}
