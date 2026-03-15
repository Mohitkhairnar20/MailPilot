require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { initializeEmailQueue } = require("./queues/emailQueue");
const { startCampaignScheduler } = require("./services/schedulerService");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await initializeEmailQueue();
    startCampaignScheduler();

    app.listen(PORT, () => {
      console.log(`MailPilot backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
