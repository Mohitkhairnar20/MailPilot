const { Queue } = require("bullmq");
const redisConnection = require("../config/redis");
const Campaign = require("../models/Campaign");
const EmailLog = require("../models/EmailLog");

const queueName = "campaign-emails";

const emailQueue = new Queue(queueName, {
  connection: redisConnection
});

const initializeEmailQueue = async () => {
  await emailQueue.waitUntilReady();
};

const enqueueCampaign = async (campaign) => {
  const campaignRecord =
    typeof campaign.populate === "function" || typeof campaign.toObject === "function"
      ? campaign
      : await Campaign.findById(campaign);

  if (!campaignRecord) {
    throw new Error("Campaign not found for queueing");
  }

  if (!campaignRecord.recipients.length) {
    throw new Error("Campaign must have at least one recipient");
  }

  const jobs = campaignRecord.recipients.map((recipient) => ({
    name: "send-campaign-email",
    data: {
      campaignId: campaignRecord._id.toString(),
      userId: campaignRecord.user.toString(),
      title: campaignRecord.title,
      subject: recipient.personalizedSubject || campaignRecord.subject,
      content: recipient.personalizedContent || campaignRecord.content,
      recipient: {
        email: recipient.email,
        name: recipient.name || "",
        company: recipient.company || "",
        role: recipient.role || ""
      }
    },
    opts: {
      jobId: `${campaignRecord._id.toString()}__${recipient.email.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
      attempts: Number(process.env.EMAIL_JOB_ATTEMPTS || 3),
      backoff: {
        type: "exponential",
        delay: Number(process.env.EMAIL_JOB_BACKOFF_MS || 5000)
      },
      removeOnComplete: 1000,
      removeOnFail: false
    }
  }));

  await Promise.all(
    campaignRecord.recipients.map((recipient) =>
      EmailLog.findOneAndUpdate(
        {
          campaign: campaignRecord._id,
          recipientEmail: recipient.email.toLowerCase()
        },
        {
          $setOnInsert: {
            campaign: campaignRecord._id,
            user: campaignRecord.user,
            subject: recipient.personalizedSubject || campaignRecord.subject,
            recipientEmail: recipient.email.toLowerCase(),
            recipientName: recipient.name || ""
          },
          $set: {
            status: "queued",
            lastError: ""
          }
        },
        {
          upsert: true,
          new: true
        }
      )
    )
  );

  await emailQueue.addBulk(jobs);
};

module.exports = {
  emailQueue,
  queueName,
  initializeEmailQueue,
  enqueueCampaign
};
