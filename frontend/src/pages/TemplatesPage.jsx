import { useDeferredValue, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import EmptyState from "../components/EmptyState";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";

const initialSummary = {
  total: 0,
  manual: 0,
  ai: 0,
  usedRecently: 0
};

const initialForm = {
  name: "",
  subject: "",
  content: "",
  prompt: "",
  source: "manual"
};

const sourcePillClass = {
  manual: "bg-slate-100 text-slate-700 border border-slate-200",
  ai: "bg-[#fff1e5] text-[#d16d35] border border-[#ffe0cc]"
};

function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [summary, setSummary] = useState(initialSummary);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let cancelled = false;

    const loadTemplates = async () => {
      setLoading(true);

      try {
        const response = await apiClient.get("/templates", {
          params: {
            search: deferredSearch.trim() || undefined,
            source: sourceFilter === "all" ? undefined : sourceFilter
          }
        });

        if (cancelled) {
          return;
        }

        setTemplates(response.data.data || []);
        setSummary(response.data.meta || initialSummary);
        setError("");
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || "Unable to load templates right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTemplates();

    return () => {
      cancelled = true;
    };
  }, [deferredSearch, refreshToken, sourceFilter]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId("");
  };

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingId) {
        await apiClient.put(`/templates/${editingId}`, form);
        setMessage("Template updated successfully.");
      } else {
        await apiClient.post("/templates", form);
        setMessage("Template saved to your library.");
      }

      resetForm();
      setRefreshToken((current) => current + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save template.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (template) => {
    setEditingId(template._id);
    setForm({
      name: template.name || "",
      subject: template.subject || "",
      content: template.content || "",
      prompt: template.prompt || "",
      source: template.source || "manual"
    });
    setMessage("");
    setError("");
  };

  const handleDelete = async (templateId) => {
    setDeletingId(templateId);
    setError("");
    setMessage("");

    try {
      await apiClient.delete(`/templates/${templateId}`);

      if (editingId === templateId) {
        resetForm();
      }

      setMessage("Template deleted successfully.");
      setRefreshToken((current) => current + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete template.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Templates"
        title="Save reusable campaign drafts"
        description="Store manual templates, AI-generated drafts, and edited variants so your next campaign starts from a working baseline instead of a blank editor."
        action={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-[#e3d8ca] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#faf6f0]"
            >
              New template
            </button>
            <Link
              to="/app/campaigns/new"
              className="rounded-xl bg-[#132238] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Use in campaign
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total Templates" value={summary.total} helper="All saved templates in your library." />
        <MetricCard label="Manual" value={summary.manual} helper="Templates written directly by users." />
        <MetricCard label="AI Drafts" value={summary.ai} helper="Templates originating from AI-assisted generation." />
        <MetricCard label="Used Recently" value={summary.usedRecently} helper="Templates applied to campaigns at least once." />
      </div>

      <div className="rounded-[1.35rem] border border-[#ece4d8] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Filters</p>
            <h2 className="mt-2 font-display text-[1.7rem] text-ink">Browse your library</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-[260px_180px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search template name, subject, or prompt"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
            />
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
            >
              <option value="all">All sources</option>
              <option value="manual">Manual</option>
              <option value="ai">AI assisted</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-[#ece4d8] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {editingId ? "Edit template" : "Save template"}
              </p>
              <h2 className="mt-2 font-display text-[1.8rem] text-ink">
                {editingId ? "Update template library entry" : "Create a reusable draft"}
              </h2>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-[#e3d8ca] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#faf6f0]"
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Template name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
                  placeholder="Founders outreach v1"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Source</span>
                <select
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
                >
                  <option value="manual">Manual</option>
                  <option value="ai">AI assisted</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Subject</span>
              <input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
                placeholder="Introducing MailPilot for {{company}}"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Content</span>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                className="min-h-44 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
                placeholder="Hello {{firstName}},"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">AI prompt reference</span>
              <textarea
                name="prompt"
                value={form.prompt}
                onChange={handleChange}
                className="min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
                placeholder="Optional. Store the original AI prompt used to generate this draft."
              />
            </label>
          </div>

          {message ? <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#132238] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update template" : "Save template"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-[#e3d8ca] bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#faf6f0]"
            >
              Reset
            </button>
          </div>
        </form>

        <div className="rounded-[1.5rem] border border-[#ece4d8] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Template list</p>
              <h2 className="mt-2 font-display text-[1.8rem] text-ink">Saved drafts</h2>
            </div>
            <span className="text-sm text-slate-500">{loading ? "Loading..." : `${templates.length} visible`}</span>
          </div>

          {loading ? (
            <div className="mt-5 rounded-[1.3rem] border border-[#ece4d8] bg-[#fcfaf7] p-8 text-center text-slate-500">
              Loading templates...
            </div>
          ) : null}

          {!loading && templates.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="No templates found"
                description={
                  search || sourceFilter !== "all"
                    ? "No templates match the current filters."
                    : "Save your first manual or AI-assisted draft here. Templates can then be reused inside the campaign wizard."
                }
              />
            </div>
          ) : null}

          {!loading && templates.length > 0 ? (
            <div className="mt-5 space-y-3">
              {templates.map((template) => (
                <div key={template._id} className="rounded-[1.1rem] border border-[#ece4d8] bg-[#fcfaf7] p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink">{template.name}</p>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${
                            sourcePillClass[template.source] || "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {template.source}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-700">{template.subject}</p>
                      <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">{template.content}</p>
                      {template.prompt ? (
                        <p className="mt-3 text-xs leading-6 text-slate-500">
                          Prompt: {template.prompt}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                        <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
                        <span>{template.lastUsedAt ? `Used ${new Date(template.lastUsedAt).toLocaleDateString()}` : "Not used yet"}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(template)}
                        className="rounded-xl border border-[#e3d8ca] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#faf6f0]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(template._id)}
                        disabled={deletingId === template._id}
                        className="rounded-xl bg-[#132238] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === template._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default TemplatesPage;
