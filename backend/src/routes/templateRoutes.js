const express = require("express");
const {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  markTemplateUsed
} = require("../controllers/templateController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getTemplates);
router.post("/", createTemplate);
router.put("/:templateId", updateTemplate);
router.delete("/:templateId", deleteTemplate);
router.patch("/:templateId/use", markTemplateUsed);

module.exports = router;
