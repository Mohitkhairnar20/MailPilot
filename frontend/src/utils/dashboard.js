export const fallbackCampaigns = [
  {
    _id: "1",
    title: "Internship Outreach Batch",
    subject: "Application for Software Intern",
    recipients: new Array(120).fill(null),
    status: "sent",
    scheduleAt: null,
    analytics: { totalSent: 120 },
    createdAt: "2026-03-10T10:30:00.000Z"
  },
  {
    _id: "2",
    title: "Product Launch Teaser",
    subject: "AI workflows for lean sales teams",
    recipients: new Array(80).fill(null),
    status: "scheduled",
    scheduleAt: "2026-03-15T09:00:00.000Z",
    analytics: { totalSent: 0 },
    createdAt: "2026-03-12T14:00:00.000Z"
  },
  {
    _id: "3",
    title: "Reactivation Sequence",
    subject: "Still exploring email automation?",
    recipients: new Array(45).fill(null),
    status: "failed",
    scheduleAt: null,
    analytics: { totalSent: 0 },
    createdAt: "2026-03-09T08:15:00.000Z"
  }
];

export const fallbackLogs = [
  {
    _id: "l1",
    recipientEmail: "rahul@example.com",
    recipientName: "Rahul",
    subject: "Application for Software Intern",
    status: "sent",
    attempts: 1,
    updatedAt: "2026-03-13T11:00:00.000Z",
    lastError: ""
  },
  {
    _id: "l2",
    recipientEmail: "priya@example.com",
    recipientName: "Priya",
    subject: "Application for Software Intern",
    status: "failed",
    attempts: 3,
    updatedAt: "2026-03-13T11:08:00.000Z",
    lastError: "SMTP connection timeout"
  },
  {
    _id: "l3",
    recipientEmail: "alex@example.com",
    recipientName: "Alex",
    subject: "Application for Software Intern",
    status: "queued",
    attempts: 1,
    updatedAt: "2026-03-13T11:10:00.000Z",
    lastError: ""
  }
];

export function computeDashboardMetrics(campaigns, logs = []) {
  const totalEmailsSent =
    logs.length > 0
      ? logs.filter((log) => log.status === "sent").length
      : campaigns.reduce((sum, campaign) => sum + (campaign.analytics?.totalSent || 0), 0);

  const failedEmails =
    logs.length > 0
      ? logs.filter((log) => log.status === "failed").length
      : campaigns
          .filter((campaign) => campaign.status === "failed")
          .reduce((sum, campaign) => sum + (campaign.recipients?.length || 0), 0);

  const scheduledEmails = campaigns
    .filter((campaign) => campaign.status === "scheduled")
    .reduce((sum, campaign) => sum + (campaign.recipients?.length || 0), 0);

  return {
    totalEmailsSent,
    failedEmails,
    scheduledEmails
  };
}

export function buildActivityChartData(campaigns) {
  const map = new Map();

  campaigns.forEach((campaign) => {
    const dateKey = new Date(campaign.createdAt || Date.now()).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
    map.set(dateKey, (map.get(dateKey) || 0) + (campaign.recipients?.length || 0));
  });

  return Array.from(map.entries()).map(([label, emails]) => ({ label, emails }));
}

export function buildStatusBreakdown(logs) {
  const summary = ["sent", "failed", "queued"].map((name) => ({
    name,
    value: logs.filter((log) => log.status === name).length
  }));

  return summary.every((item) => item.value === 0)
    ? [
        { name: "sent", value: 12 },
        { name: "failed", value: 3 },
        { name: "queued", value: 5 }
      ]
    : summary;
}

export function buildVolumeChartData(campaigns, logs) {
  const byDay = new Map();

  campaigns.forEach((campaign) => {
    const key = new Date(campaign.createdAt || Date.now()).toLocaleDateString(undefined, {
      weekday: "short"
    });
    const previous = byDay.get(key) || { label: key, sent: 0, failed: 0 };
    previous.sent += campaign.analytics?.totalSent || 0;
    byDay.set(key, previous);
  });

  logs.forEach((log) => {
    const key = new Date(log.updatedAt || Date.now()).toLocaleDateString(undefined, {
      weekday: "short"
    });
    const previous = byDay.get(key) || { label: key, sent: 0, failed: 0 };
    if (log.status === "failed") {
      previous.failed += 1;
    }
    byDay.set(key, previous);
  });

  return byDay.size
    ? Array.from(byDay.values())
    : [
        { label: "Mon", sent: 38, failed: 2 },
        { label: "Tue", sent: 54, failed: 5 },
        { label: "Wed", sent: 49, failed: 3 },
        { label: "Thu", sent: 72, failed: 6 },
        { label: "Fri", sent: 61, failed: 2 }
      ];
}
