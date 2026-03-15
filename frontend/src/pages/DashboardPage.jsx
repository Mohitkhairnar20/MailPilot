import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import { EmailActivityChart } from "../components/ActivityChart";
import CampaignTable from "../components/CampaignTable";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import {
  buildActivityChartData,
  computeDashboardMetrics,
  fallbackCampaigns,
  fallbackLogs
} from "../utils/dashboard";

function DashboardPage() {
  const [campaigns, setCampaigns] = useState(fallbackCampaigns);
  const [logs, setLogs] = useState(fallbackLogs);

  useEffect(() => {
    const loadData = async () => {
      const [campaignsResponse, logsResponse] = await Promise.allSettled([
        apiClient.get("/campaigns"),
        apiClient.get("/campaigns/logs")
      ]);

      if (campaignsResponse.status === "fulfilled") {
        setCampaigns(campaignsResponse.value.data.data);
      }

      if (logsResponse.status === "fulfilled") {
        setLogs(logsResponse.value.data.data);
      }
    };

    loadData();
  }, []);

  const metrics = computeDashboardMetrics(campaigns, logs);
  const activityData = buildActivityChartData(campaigns);
  const recentCampaigns = campaigns.slice(0, 3);

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="A structured view of your sending operations."
        description="Move from campaign creation to delivery tracking with a calmer, more professional control surface."
        action={
          <Link
            to="/app/campaigns/new"
            className="rounded-xl bg-[#132238] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Create Campaign
          </Link>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.1rem] border border-[#24354f] bg-[linear-gradient(135deg,#132238_0%,#1e3150_100%)] p-6 text-white shadow-[0_12px_30px_rgba(19,34,56,0.18)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ff9b8b]">Control center</p>
          <h2 className="mt-3 font-display text-[2.3rem] font-semibold leading-tight">
            Run campaigns, monitor delivery, and keep the workflow moving.
          </h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            Everything important is visible from the first screen: the next action, recent campaigns, and current send performance.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link to="/app/campaigns/new" className="rounded-xl bg-white px-4 py-4 text-sm font-semibold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5">
              Create a campaign
            </Link>
            <Link to="/app/campaigns/upload" className="rounded-xl bg-white/10 px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/15">
              Upload CSV
            </Link>
            <Link to="/app/logs" className="rounded-xl bg-white/10 px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/15">
              Check logs
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Total Emails Sent" value={metrics.totalEmailsSent} helper="Delivered successfully across all campaigns." />
          <MetricCard label="Failed Emails" value={metrics.failedEmails} helper="Messages that need attention or retry." />
          <MetricCard label="Scheduled Emails" value={metrics.scheduledEmails} helper="Recipients waiting for the next send window." />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="rounded-[1.1rem] border border-[#ece4d8] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recent campaigns</p>
              <h2 className="mt-2 font-display text-[1.8rem] text-ink">What is active now</h2>
            </div>
            <Link to="/app/campaigns/upload" className="text-sm font-semibold text-coral">
              Upload a CSV
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {recentCampaigns.map((campaign) => (
              <div key={campaign._id} className="rounded-xl border border-[#ece4d8] bg-[#fcfaf7] px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">{campaign.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{campaign.subject}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-sm">
                    {campaign.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                  <span>{campaign.recipients?.length || 0} recipients</span>
                  <span>{campaign.scheduleAt ? "Scheduled" : "Send now"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <EmailActivityChart data={activityData} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">All campaigns</p>
            <h2 className="mt-2 font-display text-[1.8rem] text-ink">Campaign list</h2>
          </div>
          <Link to="/app/analytics" className="text-sm font-semibold text-coral">
            View analytics
          </Link>
        </div>
        <CampaignTable campaigns={campaigns} />
      </div>
    </section>
  );
}

export default DashboardPage;
