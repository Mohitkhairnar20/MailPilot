import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { useAuth } from "../hooks/useAuth";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await login(formData);
      navigate(location.state?.from?.pathname || "/app");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back to your sending cockpit."
      subtitle="Sign in to manage queued campaigns, upload CSV contacts, and monitor email delivery performance."
      accent={<div className="mt-10 rounded-[1.5rem] bg-coral px-5 py-4 text-sm font-semibold text-white">Fast-moving teams use MailPilot to keep high-volume outreach reliable.</div>}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-coral">Login</p>
      <h2 className="mt-3 font-display text-3xl font-semibold text-ink">Sign in</h2>
      <p className="mt-3 text-slate-600">Use your MailPilot account to continue.</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
          <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-coral" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@company.com" required />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
          <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-coral" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" required />
        </label>
        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
        <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-6">
        <GoogleSignInButton
          onSuccess={() => navigate(location.state?.from?.pathname || "/app")}
          onError={(message) => setError(message)}
        />
      </div>

      <p className="mt-6 text-sm text-slate-600">
        Need an account?{" "}
        <Link className="font-semibold text-coral" to="/signup">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

export default LoginPage;
