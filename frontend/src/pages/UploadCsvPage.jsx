import { useState } from "react";
import PageHeader from "../components/PageHeader";
import apiClient from "../api/client";

function UploadCsvPage() {
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    prompt: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("subject", formData.subject);
      payload.append("prompt", formData.prompt);

      if (file) {
        payload.append("file", file);
      }

      const response = await apiClient.post("/campaigns/bulk", payload, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setMessage(`Bulk campaign created. ${response.data.data.queuedRecipients} recipients queued for personalization.`);
      setFormData({ title: "", subject: "", prompt: "" });
      setFile(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to upload the CSV.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Bulk Upload"
        title="Upload a CSV and personalize every email"
        description="Import a recipient list using the required CSV schema, let OpenAI generate tailored messages, and push each recipient into the delivery queue."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-slate-200/70 bg-white/90 p-6 shadow-sm">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Campaign title</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-coral" name="title" value={formData.title} onChange={handleChange} required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Base subject</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-coral" name="subject" value={formData.subject} onChange={handleChange} required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">AI prompt</span>
            <textarea className="min-h-44 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-coral" name="prompt" value={formData.prompt} onChange={handleChange} placeholder="Write the instructions for how each personalized email should sound." required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Recipient CSV</span>
            <input className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4" type="file" accept=".csv" onChange={(event) => setFile(event.target.files?.[0] || null)} required />
          </label>

          {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}

          <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? "Uploading CSV..." : "Upload and Queue"}
          </button>
        </form>

        <div className="rounded-[2rem] bg-ink p-6 text-white shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-coral">CSV Format</p>
          <h2 className="mt-3 font-display text-3xl font-semibold">Use this header row</h2>
          <pre className="mt-6 overflow-x-auto rounded-[1.5rem] bg-white/10 p-5 text-sm text-slate-100">
{`name,email,company,role
Rahul,rahul@example.com,Google,Software Intern
Priya,priya@example.com,Microsoft,Frontend Engineer`}
          </pre>
          <p className="mt-5 text-sm text-slate-300">
            MailPilot parses the CSV, asks OpenAI to generate personalized content for each recipient, and queues every email with retry handling.
          </p>
        </div>
      </div>
    </section>
  );
}

export default UploadCsvPage;
