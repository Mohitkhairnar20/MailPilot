import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { useAuth } from "../hooks/useAuth";

function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
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
      await signup(formData);
      navigate("/app");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create your account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Launch your first AI-powered campaign in minutes."
      subtitle="Create a workspace to manage recipients, generate personalized content, and watch delivery metrics in one place."
      accent={<div className="mt-10 rounded-[1.5rem] border border-white/10 bg-white/10 px-5 py-4 text-sm text-slate-200">MailPilot combines queue-backed sending with an analytics layer designed for operators.</div>}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-coral">Signup</p>
      <h2 className="mt-3 font-display text-3xl font-semibold text-ink">Create your account</h2>
      <p className="mt-3 text-slate-600">Start building bulk campaigns with secure JWT authentication.</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Full name</span>
          <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-coral" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Mohit Khairnar" required />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
          <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-coral" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@company.com" required />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
          <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-coral" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="At least 8 characters" required />
        </label>
        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
        <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-6">
        <GoogleSignInButton onSuccess={() => navigate("/app")} onError={(message) => setError(message)} />
      </div>

      <p className="mt-6 text-sm text-slate-600">
        Already have an account?{" "}
        <Link className="font-semibold text-coral" to="/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default SignupPage;
