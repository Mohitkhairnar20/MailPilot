import { useDeferredValue, useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import apiClient from "../api/client";

const initialSummary = {
  total: 0,
  sent: 0,
  failed: 0,
  queued: 0
};

const statusPillClass = {
  sent: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  failed: "bg-rose-50 text-rose-700 border border-rose-100",
  queued: "bg-amber-50 text-amber-700 border border-amber-100"
};

function EmailLogsPage() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(initialSummary);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let cancelled = false;

    const loadLogs = async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await apiClient.get("/campaigns/logs", {
          params: {
            status: statusFilter === "all" ? undefined : statusFilter,
            search: deferredSearch.trim() || undefined
          }
        });

        if (cancelled) {
          return;
        }

        setLogs(response.data.data || []);
        setSummary(response.data.meta || initialSummary);
        setError("");
        setLastUpdated(new Date());
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || "Unable to load delivery logs right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadLogs();
    const intervalId = setInterval(() => loadLogs(true), 15000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [deferredSearch, refreshToken, statusFilter]);

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Delivery Logs"
        title="Trace every recipient delivery"
        description="Inspect real send outcomes, retry attempts, timestamps, and the latest provider errors as jobs move through the queue."
        action={
          <div className="flex items-center gap-3">
            {lastUpdated ? (
              <span className="text-sm text-slate-500">
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setRefreshToken((current) => current + 1)}
              className="rounded-xl border border-[#e3d8ca] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#faf6f0]"
            >
              Refresh logs
            </button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total Logs" value={summary.total} helper="All delivery events returned by the worker." />
        <MetricCard label="Sent" value={summary.sent} helper="Recipients accepted successfully by the provider." />
        <MetricCard label="Failed" value={summary.failed} helper="Recipients that exhausted retries or hard failed." />
        <MetricCard label="Queued" value={summary.queued} helper="Recipients still waiting in the pipeline." />
      </div>

      <div className="rounded-[1.35rem] border border-[#ece4d8] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Filters</p>
            <h2 className="mt-2 font-display text-[1.7rem] text-ink">Live delivery stream</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-[240px_180px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search recipient, subject, or error"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-coral"
            >
              <option value="all">All statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="queued">Queued</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[1.75rem] border border-[#ece4d8] bg-white p-10 text-center text-slate-500 shadow-sm">
          Loading live email logs...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
      ) : null}

      {!loading && logs.length === 0 ? (
        <EmptyState
          title="No email logs found"
          description={
            search || statusFilter !== "all"
              ? "No log entries match the current filters. Try clearing search or switching the status filter."
              : "Once your worker processes campaign jobs, delivery logs will appear here automatically."
          }
        />
      ) : null}

      {!loading && logs.length > 0 ? (
        <div className="overflow-hidden rounded-[1.75rem] border border-[#ece4d8] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#f0e8dd] bg-[#fcfaf7] px-5 py-4 text-sm text-slate-500">
            <span>{logs.length} entries visible</span>
            <span>{refreshing ? "Refreshing..." : "Auto-refresh every 15s"}</span>
          </div>
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Recipient</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Subject</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Status</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Attempts</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Updated</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Last Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-[#fcfaf7]">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink">{log.recipientName || "Unknown recipient"}</p>
                    <p className="text-sm text-slate-500">{log.recipientEmail}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{log.subject}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${statusPillClass[log.status] || "bg-slate-100 text-slate-600"}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{log.attempts}</td>
                  <td className="px-5 py-4 text-slate-600">{new Date(log.updatedAt).toLocaleString()}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{log.lastError || "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

export default EmailLogsPage;

