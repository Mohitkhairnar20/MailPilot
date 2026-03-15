import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import { EmailActivityChart, StatusBreakdownChart, VolumeChart } from "../components/ActivityChart";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import apiClient from "../api/client";

const initialAnalytics = {
  metrics: {
    totalEmailsSent: 0,
    failedEmails: 0,
    queuedEmails: 0,
    scheduledEmails: 0,
    totalRecipients: 0,
    deliveryRate: 0
  },
  activity: [],
  statusBreakdown: [],
  volume: [],
  campaignPerformance: []
};

const statusTone = {
  sent: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  failed: "bg-rose-50 text-rose-700 border border-rose-100",
  scheduled: "bg-amber-50 text-amber-700 border border-amber-100",
  processing: "bg-sky-50 text-sky-700 border border-sky-100",
  draft: "bg-slate-100 text-slate-600 border border-slate-200"
};

function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadAnalytics = async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await apiClient.get("/campaigns/analytics");

        if (cancelled) {
          return;
        }

        setAnalytics(response.data.data || initialAnalytics);
        setError("");
        setLastUpdated(new Date());
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || "Unable to load analytics right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadAnalytics();
    const intervalId = setInterval(() => loadAnalytics(true), 15000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [refreshToken]);

  const { metrics, activity, statusBreakdown, volume, campaignPerformance } = analytics;
  const hasAnyData = metrics.totalRecipients > 0 || campaignPerformance.length > 0 || activity.some((entry) => entry.emails > 0);

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Analytics"
        title="Understand campaign performance at a glance"
        description="See real send volume, failure patterns, queue pressure, and campaign progress in one live analytics workspace."
        action={
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-500">
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Waiting for first sync"}
            </div>
            <button
              type="button"
              onClick={() => setRefreshToken((current) => current + 1)}
              className="rounded-xl border border-[#e3d8ca] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#faf6f0]"
            >
              Refresh analytics
            </button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Emails Sent" value={metrics.totalEmailsSent} helper="Recipients accepted successfully by your provider." />
        <MetricCard label="Failed Emails" value={metrics.failedEmails} helper="Recipients that exhausted retries or hard failed." />
        <MetricCard label="Queued Emails" value={metrics.queuedEmails} helper="Recipients still moving through the queue." />
        <MetricCard label="Delivery Rate" value={`${metrics.deliveryRate}%`} helper="Sent recipients divided by total campaign audience." />
      </div>

      {loading ? (
        <div className="rounded-[1.75rem] border border-[#ece4d8] bg-white p-10 text-center text-slate-500 shadow-sm">
          Loading live analytics...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
      ) : null}

      {!loading && !hasAnyData ? (
        <EmptyState
          title="No analytics available yet"
          description="Create and queue a campaign first. Once logs and send events exist, this page will populate automatically."
        />
      ) : null}

      {!loading && hasAnyData ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <EmailActivityChart data={activity} />
            <StatusBreakdownChart data={statusBreakdown} />
          </div>

          <VolumeChart data={volume} />

          <div className="rounded-[1.25rem] border border-[#ece4d8] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Top campaigns</p>
                <h3 className="mt-2 font-display text-[1.8rem] text-ink">Campaign performance</h3>
              </div>
              <span className="text-sm text-slate-500">{refreshing ? "Refreshing..." : "Auto-refresh every 15s"}</span>
            </div>

            {campaignPerformance.length === 0 ? (
              <p className="text-sm text-slate-500">No ranked campaign data yet.</p>
            ) : (
              <div className="space-y-3">
                {campaignPerformance.map((campaign) => (
                  <div key={campaign.id} className="rounded-2xl border border-slate-200 bg-[#fcfaf7] px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{campaign.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {campaign.sent} sent out of {campaign.recipients} recipients
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${statusTone[campaign.status] || "bg-slate-100 text-slate-600"}`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

export default AnalyticsPage;

