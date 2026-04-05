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

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const looksLikeHtml = (value) => /<\/?[a-z][\s\S]*>/i.test(String(value || ""));

const plainTextToHtml = (text) => {
  const normalized = String(text || "").replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return "";
  }

  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const htmlBlocks = [];

  blocks.forEach((block) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const isBulletList = lines.length > 1 && lines.every((line) => /^([-*]|\d+[.)])\s+/.test(line));

    if (isBulletList) {
      const items = lines
        .map((line) => line.replace(/^([-*]|\d+[.)])\s+/, "").trim())
        .filter(Boolean)
        .map((line) => `<li style="margin:0 0 8px;">${escapeHtml(line)}</li>`)
        .join("");

      htmlBlocks.push(`<ul style="margin:0 0 16px 20px; padding:0;">${items}</ul>`);
      return;
    }

    const paragraph = lines.map((line) => escapeHtml(line)).join("<br />");
    htmlBlocks.push(`<p style="margin:0 0 16px; line-height:1.7; color:#1f2937;">${paragraph}</p>`);
  });

  return `
    <div style="background:#f8fafc; padding:24px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; padding:32px; font-family:Arial, Helvetica, sans-serif; font-size:16px;">
        ${htmlBlocks.join("")}
      </div>
    </div>
  `.trim();
};

const htmlToPlainText = (html) =>
  String(html || "")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\n\s+\n/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

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
      const renderedContent = renderTemplate(content, recipient);
      const renderedHtml = looksLikeHtml(renderedContent) ? renderedContent : plainTextToHtml(renderedContent);
      const renderedText = looksLikeHtml(renderedContent) ? htmlToPlainText(renderedHtml) : renderedContent;

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
