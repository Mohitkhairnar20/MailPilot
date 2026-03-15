const Campaign = require("../models/Campaign");
const EmailLog = require("../models/EmailLog");
const { enqueueCampaign } = require("../queues/emailQueue");
const {
  parseRecipientsCsv,
  generatePersonalizedEmails,
  generateCampaignTemplate
} = require("../services/aiEmailService");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildDayBuckets = (days = 7) => {
  const buckets = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);

    buckets.push({
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
      }),
      sent: 0,
      failed: 0,
      queued: 0,
      emails: 0
    });
  }

  return buckets;
};

const createAndQueueCampaign = async ({ campaignData, queueImmediately }) => {
  const campaign = await Campaign.create(campaignData);

  if (queueImmediately) {
    campaign.status = "processing";
    await campaign.save();
    await enqueueCampaign(campaign);
  }

  return campaign;
};

const getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    next(error);
  }
};

const createCampaign = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      user: req.user.id
    };

    const shouldQueueImmediately =
      payload.status === "processing" ||
      (payload.status === "scheduled" && (!payload.scheduleAt || new Date(payload.scheduleAt) <= new Date()));

    const campaign = await createAndQueueCampaign({
      campaignData: payload,
      queueImmediately: shouldQueueImmediately
    });

    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    next(error);
  }
};

const generateCampaignTemplateDraft = async (req, res, next) => {
  try {
    const { title, prompt, sampleRecipients = [] } = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required to generate a template"
      });
    }

    const template = await generateCampaignTemplate({
      title: title?.trim() || "",
      prompt: prompt.trim(),
      recipientCount: Array.isArray(sampleRecipients) ? sampleRecipients.length : 0,
      sampleRecipients: Array.isArray(sampleRecipients) ? sampleRecipients.slice(0, 5) : []
    });

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

const createBulkCampaign = async (req, res, next) => {
  try {
    const { title, subject, prompt, scheduleAt } = req.body;

    if (!title || !subject || !prompt) {
      return res.status(400).json({
        success: false,
        message: "Title, subject, and prompt are required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Recipient CSV file is required"
      });
    }

    const recipients = await parseRecipientsCsv(req.file.buffer);
    if (!recipients.length) {
      return res.status(400).json({
        success: false,
        message: "CSV file does not contain any valid recipients"
      });
    }

    const personalizedRecipients = await generatePersonalizedEmails({
      subject,
      prompt,
      recipients
    });

    const scheduleDate = scheduleAt ? new Date(scheduleAt) : null;
    if (scheduleAt && Number.isNaN(scheduleDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "scheduleAt must be a valid date"
      });
    }

    const shouldQueueImmediately = !scheduleDate || scheduleDate <= new Date();
    const campaign = await createAndQueueCampaign({
      campaignData: {
        user: req.user.id,
        title,
        subject,
        content: prompt,
        recipients: personalizedRecipients,
        scheduleAt: scheduleDate,
        status: shouldQueueImmediately ? "processing" : "scheduled"
      },
      queueImmediately: shouldQueueImmediately
    });

    res.status(201).json({
      success: true,
      data: {
        campaign,
        queuedRecipients: personalizedRecipients.length
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCampaignStats = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({ user: req.user.id });
    const totalCampaigns = campaigns.length;
    const totalSent = campaigns.reduce((sum, campaign) => sum + campaign.analytics.totalSent, 0);
    const avgOpenRate =
      totalCampaigns === 0
        ? 0
        : campaigns.reduce((sum, campaign) => sum + campaign.analytics.openRate, 0) / totalCampaigns;

    res.json({
      success: true,
      data: {
        totalCampaigns,
        totalSent,
        avgOpenRate: Number(avgOpenRate.toFixed(2))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCampaignLogs = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filters = { user: req.user.id };

    if (status && ["queued", "sent", "failed"].includes(status)) {
      filters.status = status;
    }

    if (search?.trim()) {
      const pattern = new RegExp(escapeRegex(search.trim()), "i");
      filters.$or = [
        { recipientEmail: pattern },
        { recipientName: pattern },
        { subject: pattern },
        { lastError: pattern }
      ];
    }

    const logs = await EmailLog.find(filters).sort({ updatedAt: -1 }).lean();

    const counts = logs.reduce(
      (result, log) => ({
        ...result,
        [log.status]: (result[log.status] || 0) + 1
      }),
      { queued: 0, sent: 0, failed: 0 }
    );

    res.json({
      success: true,
      data: logs,
      meta: {
        total: logs.length,
        queued: counts.queued || 0,
        sent: counts.sent || 0,
        failed: counts.failed || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCampaignAnalytics = async (req, res, next) => {
  try {
    const [campaigns, logs] = await Promise.all([
      Campaign.find({ user: req.user.id }).sort({ createdAt: -1 }).lean(),
      EmailLog.find({ user: req.user.id }).sort({ updatedAt: -1 }).lean()
    ]);

    const totalRecipients = campaigns.reduce(
      (sum, campaign) => sum + (campaign.recipients?.length || 0),
      0
    );
    const totalEmailsSent = logs.filter((log) => log.status === "sent").length;
    const failedEmails = logs.filter((log) => log.status === "failed").length;
    const queuedEmails = logs.filter((log) => log.status === "queued").length;
    const scheduledEmails = campaigns
      .filter((campaign) => campaign.status === "scheduled")
      .reduce((sum, campaign) => sum + (campaign.recipients?.length || 0), 0);

    const activityByDay = buildDayBuckets(7);
    const bucketLookup = new Map(activityByDay.map((bucket) => [bucket.key, bucket]));

    logs.forEach((log) => {
      const sourceDate = new Date(log.updatedAt || log.createdAt || Date.now());
      const key = sourceDate.toISOString().slice(0, 10);
      const bucket = bucketLookup.get(key);

      if (!bucket) {
        return;
      }

      if (log.status === "sent") {
        bucket.sent += 1;
      } else if (log.status === "failed") {
        bucket.failed += 1;
      } else if (log.status === "queued") {
        bucket.queued += 1;
      }

      bucket.emails += 1;
    });

    const statusBreakdown = [
      { name: "sent", value: totalEmailsSent },
      { name: "failed", value: failedEmails },
      { name: "queued", value: queuedEmails }
    ];

    const campaignPerformance = campaigns
      .slice()
      .sort(
        (left, right) =>
          (right.analytics?.totalSent || 0) - (left.analytics?.totalSent || 0)
      )
      .slice(0, 5)
      .map((campaign) => ({
        id: campaign._id,
        title: campaign.title,
        recipients: campaign.recipients?.length || 0,
        sent: campaign.analytics?.totalSent || 0,
        status: campaign.status
      }));

    res.json({
      success: true,
      data: {
        metrics: {
          totalEmailsSent,
          failedEmails,
          queuedEmails,
          scheduledEmails,
          totalRecipients,
          deliveryRate: totalRecipients
            ? Number(((totalEmailsSent / totalRecipients) * 100).toFixed(1))
            : 0
        },
        activity: activityByDay.map((bucket) => ({
          label: bucket.label,
          emails: bucket.emails,
          sent: bucket.sent,
          failed: bucket.failed,
          queued: bucket.queued
        })),
        statusBreakdown,
        volume: activityByDay.map((bucket) => ({
          label: bucket.label,
          sent: bucket.sent,
          failed: bucket.failed,
          queued: bucket.queued
        })),
        campaignPerformance
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCampaigns,
  createCampaign,
  generateCampaignTemplateDraft,
  createBulkCampaign,
  getCampaignStats,
  getCampaignLogs,
  getCampaignAnalytics
};
