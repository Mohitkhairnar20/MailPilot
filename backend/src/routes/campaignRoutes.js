const express = require("express");
const multer = require("multer");
const {
  getCampaigns,
  createCampaign,
  generateCampaignTemplateDraft,
  createBulkCampaign,
  getCampaignStats,
  getCampaignLogs,
  getCampaignAnalytics
} = require("../controllers/campaignController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

router.use(protect);

router.get("/", getCampaigns);
router.get("/stats", getCampaignStats);
router.get("/logs", getCampaignLogs);
router.get("/analytics", getCampaignAnalytics);
router.post("/", createCampaign);
router.post("/generate-template", generateCampaignTemplateDraft);
router.post("/bulk", upload.single("file"), createBulkCampaign);

module.exports = router;
