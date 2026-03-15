import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import EmptyState from "../components/EmptyState";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";

const initialSummary = {
  total: 0,
  active: 0,
  blocked: 0,
  companies: 0,
  tags: 0
};

const initialForm = {
  name: "",
  email: "",
  company: "",
  role: "",
  tags: "",
  notes: "",
  status: "active"
};

const statusPillClass = {
  active: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  blocked: "bg-slate-100 text-slate-700 border border-slate-200"
};

function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [summary, setSummary] = useState(initialSummary);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let cancelled = false;

    const loadContacts = async () => {
      setLoading(true);

      try {
        const response = await apiClient.get("/contacts", {
          params: {
            search: deferredSearch.trim() || undefined,
            status: statusFilter === "all" ? undefined : statusFilter
          }
        });

        if (cancelled) {
          return;
        }

        setContacts(response.data.data || []);
        setSummary(response.data.meta || initialSummary);
        setError("");
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || "Unable to load contacts right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadContacts();

    return () => {
      cancelled = true;
    };
  }, [deferredSearch, refreshToken, statusFilter]);

  const visibleTags = useMemo(
    () => [...new Set(contacts.flatMap((contact) => contact.tags || []).filter(Boolean))].slice(0, 8),
    [contacts]
  );

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

    const payload = {
      ...form,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    };

    try {
      if (editingId) {
        await apiClient.put(`/contacts/${editingId}`, payload);
        setMessage("Contact updated successfully.");
      } else {
        await apiClient.post("/contacts", payload);
        setMessage("Contact created successfully.");
      }

      resetForm();
      setRefreshToken((current) => current + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save contact.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (contact) => {
    setEditingId(contact._id);
    setForm({
      name: contact.name || "",
      email: contact.email || "",
      company: contact.company || "",
      role: contact.role || "",
      tags: (contact.tags || []).join(", "),
      notes: contact.notes || "",
      status: contact.status || "active"
    });
    setMessage("");
    setError("");
  };

  const handleDelete = async (contactId) => {
    setDeletingId(contactId);
    setError("");
    setMessage("");

    try {
      await apiClient.delete(`/contacts/${contactId}`);

      if (editingId === contactId) {
        resetForm();
      }

      setMessage("Contact deleted successfully.");
      setRefreshToken((current) => current + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete contact.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Contacts"
        title="Manage saved recipients"
        description="Create reusable contacts for outreach, keep company and role details in one place, and maintain a clean recipient list for future campaigns."
        action={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-[#e3d8ca] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#faf6f0]"
            >
              New contact
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

      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Total Contacts" value={summary.total} helper="All contacts stored in your workspace." />
        <MetricCard label="Active" value={summary.active} helper="Contacts available for outreach." />
        <MetricCard label="Blocked" value={summary.blocked} helper="Contacts excluded from sends." />
        <MetricCard label="Companies" value={summary.companies} helper="Unique companies represented." />
        <MetricCard label="Tags" value={summary.tags} helper="Distinct contact tags in use." />
      </div>

      <div className="rounded-[1.35rem] border border-[#ece4d8] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Filters</p>
            <h2 className="mt-2 font-display text-[1.7rem] text-ink">Find recipients quickly</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-[260px_180px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, company, role"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {visibleTags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#ece4d8] bg-[#fcfaf7] px-3 py-1 text-xs font-medium text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
        <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-[#ece4d8] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {editingId ? "Edit contact" : "Add contact"}
              </p>
              <h2 className="mt-2 font-display text-[1.8rem] text-ink">
                {editingId ? "Update recipient details" : "Create a reusable recipient"}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
                  placeholder="Rahul Sharma"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
                  placeholder="rahul@example.com"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Company</span>
                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
                  placeholder="Google"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Role</span>
                <input
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
                  placeholder="Software Engineer"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Tags</span>
                <input
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
                  placeholder="founder, warm lead, recruiter"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Status</span>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
                >
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Notes</span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
                placeholder="Context about the relationship, outreach history, or preferred messaging."
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
              {saving ? "Saving..." : editingId ? "Update contact" : "Create contact"}
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Contact list</p>
              <h2 className="mt-2 font-display text-[1.8rem] text-ink">Saved recipients</h2>
            </div>
            <span className="text-sm text-slate-500">{loading ? "Loading..." : `${contacts.length} visible`}</span>
          </div>

          {loading ? (
            <div className="mt-5 rounded-[1.3rem] border border-[#ece4d8] bg-[#fcfaf7] p-8 text-center text-slate-500">
              Loading contacts...
            </div>
          ) : null}

          {!loading && contacts.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="No contacts found"
                description={
                  search || statusFilter !== "all"
                    ? "No contacts match the current filters."
                    : "Create your first saved recipient here. Contacts will be available for future campaign workflows."
                }
              />
            </div>
          ) : null}

          {!loading && contacts.length > 0 ? (
            <div className="mt-5 space-y-3">
              {contacts.map((contact) => (
                <div key={contact._id} className="rounded-[1.1rem] border border-[#ece4d8] bg-[#fcfaf7] p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink">{contact.name}</p>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${
                            statusPillClass[contact.status] || "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {contact.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{contact.email}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                        <span>{contact.company || "No company"}</span>
                        <span>{contact.role || "No role"}</span>
                        <span>Updated {new Date(contact.updatedAt).toLocaleDateString()}</span>
                      </div>
                      {contact.tags?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {contact.tags.map((tag) => (
                            <span
                              key={`${contact._id}-${tag}`}
                              className="rounded-full border border-[#ece4d8] bg-white px-3 py-1 text-xs font-medium text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {contact.notes ? <p className="mt-3 text-sm leading-6 text-slate-600">{contact.notes}</p> : null}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(contact)}
                        className="rounded-xl border border-[#e3d8ca] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#faf6f0]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(contact._id)}
                        disabled={deletingId === contact._id}
                        className="rounded-xl bg-[#132238] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === contact._id ? "Deleting..." : "Delete"}
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

export default ContactsPage;
