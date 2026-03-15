require("dotenv").config();

const { Worker } = require("bullmq");
const connectDB = require("../config/db");
const redisConnection = require("../config/redis");
const Campaign = require("../models/Campaign");
const EmailLog = require("../models/EmailLog");
const { queueName } = require("../queues/emailQueue");
const { sendCampaignEmail, verifyEmailTransport } = require("../services/emailService");

const renderTemplate = (template, recipient) => {
  if (!template) {
    return "";
  }

  const firstName =
    recipient.name && recipient.name.trim()
      ? recipient.name.trim().split(/\s+/)[0]
      : recipient.email.split("@")[0];

  const variables = {
    name: recipient.name || firstName,
    firstName,
    email: recipient.email || "",
    company: recipient.company || "",
    role: recipient.role || ""
  };

  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key) => variables[key] ?? "");
};

const updateCampaignStatus = async (campaignId) => {
  const [sentCount, failedCount, totalRecipients] = await Promise.all([
    EmailLog.countDocuments({ campaign: campaignId, status: "sent" }),
    EmailLog.countDocuments({ campaign: campaignId, status: "failed" }),
    Campaign.findById(campaignId).select("recipients")
  ]);

  if (!totalRecipients) {
    return;
  }

  const recipientCount = totalRecipients.recipients.length;
  const nextStatus =
    sentCount === recipientCount ? "sent" : failedCount > 0 && sentCount + failedCount === recipientCount ? "failed" : "processing";

  await Campaign.findByIdAndUpdate(campaignId, {
    status: nextStatus,
    "analytics.totalSent": sentCount
  });
};

const upsertQueuedLog = async (job) => {
  const { campaignId, userId, subject, recipient } = job.data;

  await EmailLog.findOneAndUpdate(
    { campaign: campaignId, recipientEmail: recipient.email.toLowerCase() },
    {
      $setOnInsert: {
        campaign: campaignId,
        user: userId,
        subject,
        recipientEmail: recipient.email.toLowerCase(),
        recipientName: recipient.name || "",
        status: "queued"
      },
      $set: {
        lastAttemptAt: new Date(),
        attempts: job.attemptsMade + 1
      }
    },
    { upsert: true, new: true }
  );
};

const startEmailWorker = async () => {
  await connectDB();
  await verifyEmailTransport();

  const worker = new Worker(
    queueName,
    async (job) => {
      const { campaignId, subject, content, recipient } = job.data;

      await upsertQueuedLog(job);

      const campaign = await Campaign.findById(campaignId).select("_id status");
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const renderedSubject = renderTemplate(subject, recipient);
      const renderedHtml = renderTemplate(content, recipient);
      const renderedText = renderedHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

      const result = await sendCampaignEmail({
        to: recipient.email,
        subject: renderedSubject,
        html: renderedHtml,
        text: renderedText,
        metadata: {
          campaignId,
          recipientEmail: recipient.email
        }
      });

      await EmailLog.findOneAndUpdate(
        { campaign: campaignId, recipientEmail: recipient.email.toLowerCase() },
        {
          $set: {
            status: "sent",
            attempts: job.attemptsMade + 1,
            sentAt: new Date(),
            lastAttemptAt: new Date(),
            providerMessageId: result.messageId,
            accepted: result.accepted || [],
            rejected: result.rejected || [],
            response: result.response,
            lastError: ""
          }
        },
        { new: true }
      );

      await updateCampaignStatus(campaignId);
      return result;
    },
    {
      connection: redisConnection,
      concurrency: Number(process.env.EMAIL_WORKER_CONCURRENCY || 5)
    }
  );

  worker.on("completed", async (job) => {
    console.log(`Email job ${job.id} sent successfully`);
  });

  worker.on("failed", async (job, error) => {
    if (!job) {
      return;
    }

    const isFinalAttempt = job.attemptsMade >= (job.opts.attempts || 1);
    const { campaignId, recipient } = job.data;

    await EmailLog.findOneAndUpdate(
      { campaign: campaignId, recipientEmail: recipient.email.toLowerCase() },
      {
        $set: {
          status: isFinalAttempt ? "failed" : "queued",
          attempts: job.attemptsMade,
          lastAttemptAt: new Date(),
          lastError: error.message
        }
      },
      { upsert: true, new: true }
    );

    if (isFinalAttempt) {
      await updateCampaignStatus(campaignId);
    }

    console.error(`Email job ${job.id} failed`, error.message);
  });

  console.log("MailPilot email worker is running");
};

startEmailWorker().catch((error) => {
  console.error("Failed to start MailPilot email worker", error);
  process.exit(1);
});
