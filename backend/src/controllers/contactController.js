const Contact = require("../models/Contact");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeNameFromEmail = (email) => {
  const localPart = String(email || "").split("@")[0] || "recipient";

  return localPart
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const normalizeTags = (value) => {
  if (!value) {
    return [];
  }

  const items = Array.isArray(value) ? value : String(value).split(",");
  return [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))];
};

const normalizePayload = (payload = {}) => {
  const email = String(payload.email || "").trim().toLowerCase();

  return {
    name: String(payload.name || "").trim() || normalizeNameFromEmail(email),
    email,
    company: String(payload.company || "").trim(),
    role: String(payload.role || "").trim(),
    tags: normalizeTags(payload.tags),
    notes: String(payload.notes || "").trim(),
    status: payload.status === "blocked" ? "blocked" : "active"
  };
};

const validateContactPayload = ({ email }) => {
  if (!email) {
    return "Email is required";
  }

  if (!emailPattern.test(email)) {
    return "Email format is invalid";
  }

  return null;
};

const getContacts = async (req, res, next) => {
  try {
    const { search = "", status = "all", tag = "" } = req.query;
    const filters = { user: req.user.id };

    if (status === "active" || status === "blocked") {
      filters.status = status;
    }

    if (tag.trim()) {
      filters.tags = tag.trim();
    }

    if (search.trim()) {
      const pattern = new RegExp(escapeRegex(search.trim()), "i");
      filters.$or = [
        { name: pattern },
        { email: pattern },
        { company: pattern },
        { role: pattern },
        { tags: pattern },
        { notes: pattern }
      ];
    }

    const contacts = await Contact.find(filters).sort({ updatedAt: -1 }).lean();
    const allContacts = await Contact.find({ user: req.user.id }).lean();

    const total = allContacts.length;
    const active = allContacts.filter((contact) => contact.status === "active").length;
    const blocked = allContacts.filter((contact) => contact.status === "blocked").length;
    const companies = new Set(allContacts.map((contact) => contact.company).filter(Boolean)).size;
    const tags = new Set(allContacts.flatMap((contact) => contact.tags || []).filter(Boolean)).size;

    res.json({
      success: true,
      data: contacts,
      meta: {
        total,
        active,
        blocked,
        companies,
        tags
      }
    });
  } catch (error) {
    next(error);
  }
};

const createContact = async (req, res, next) => {
  try {
    const payload = normalizePayload(req.body);
    const validationError = validateContactPayload(payload);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const contact = await Contact.create({
      ...payload,
      user: req.user.id
    });

    res.status(201).json({
      success: true,
      data: contact
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A contact with this email already exists"
      });
    }

    next(error);
  }
};

const updateContact = async (req, res, next) => {
  try {
    const payload = normalizePayload(req.body);
    const validationError = validateContactPayload(payload);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.contactId, user: req.user.id },
      payload,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A contact with this email already exists"
      });
    }

    next(error);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.contactId,
      user: req.user.id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    res.json({
      success: true,
      message: "Contact deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContacts,
  createContact,
  updateContact,
  deleteContact
};
