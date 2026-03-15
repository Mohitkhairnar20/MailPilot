const Template = require("../models/Template");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizePayload = (payload = {}) => ({
  name: String(payload.name || "").trim(),
  subject: String(payload.subject || "").trim(),
  content: String(payload.content || "").trim(),
  prompt: String(payload.prompt || "").trim(),
  source: payload.source === "ai" ? "ai" : "manual"
});

const validateTemplatePayload = ({ name, subject, content }) => {
  if (!name) {
    return "Template name is required";
  }

  if (!subject) {
    return "Template subject is required";
  }

  if (!content) {
    return "Template content is required";
  }

  return null;
};

const getTemplates = async (req, res, next) => {
  try {
    const { search = "", source = "all" } = req.query;
    const filters = { user: req.user.id };

    if (source === "manual" || source === "ai") {
      filters.source = source;
    }

    if (search.trim()) {
      const pattern = new RegExp(escapeRegex(search.trim()), "i");
      filters.$or = [
        { name: pattern },
        { subject: pattern },
        { content: pattern },
        { prompt: pattern }
      ];
    }

    const templates = await Template.find(filters)
      .sort({ lastUsedAt: -1, updatedAt: -1, createdAt: -1 })
      .lean();

    const allTemplates = await Template.find({ user: req.user.id }).lean();

    res.json({
      success: true,
      data: templates,
      meta: {
        total: allTemplates.length,
        manual: allTemplates.filter((template) => template.source === "manual").length,
        ai: allTemplates.filter((template) => template.source === "ai").length,
        usedRecently: allTemplates.filter((template) => Boolean(template.lastUsedAt)).length
      }
    });
  } catch (error) {
    next(error);
  }
};

const createTemplate = async (req, res, next) => {
  try {
    const payload = normalizePayload(req.body);
    const validationError = validateTemplatePayload(payload);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const template = await Template.create({
      ...payload,
      user: req.user.id
    });

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const payload = normalizePayload(req.body);
    const validationError = validateTemplatePayload(payload);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const template = await Template.findOneAndUpdate(
      { _id: req.params.templateId, user: req.user.id },
      payload,
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found"
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    const template = await Template.findOneAndDelete({
      _id: req.params.templateId,
      user: req.user.id
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found"
      });
    }

    res.json({
      success: true,
      message: "Template deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

const markTemplateUsed = async (req, res, next) => {
  try {
    const template = await Template.findOneAndUpdate(
      { _id: req.params.templateId, user: req.user.id },
      { lastUsedAt: new Date() },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found"
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  markTemplateUsed
};
