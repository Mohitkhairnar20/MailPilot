const cron = require("node-cron");
const Campaign = require("../models/Campaign");
const { enqueueCampaign } = require("../queues/emailQueue");

const startCampaignScheduler = () => {
  cron.schedule("*/1 * * * *", async () => {
    const dueCampaigns = await Campaign.find({
      status: "scheduled",
      scheduleAt: { $lte: new Date() }
    });

    for (const campaign of dueCampaigns) {
      campaign.status = "processing";
      await campaign.save();
      await enqueueCampaign(campaign);
    }
  });
};

module.exports = { startCampaignScheduler };
