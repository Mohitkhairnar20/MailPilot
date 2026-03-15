const mongoose = require("mongoose");

const normalizeTags = (value) => {
  if (!value) {
    return [];
  }

  const items = Array.isArray(value) ? value : String(value).split(",");

  return [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))];
};

const contactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    company: {
      type: String,
      default: "",
      trim: true
    },
    role: {
      type: String,
      default: "",
      trim: true
    },
    tags: {
      type: [String],
      default: [],
      set: normalizeTags
    },
    notes: {
      type: String,
      default: "",
      trim: true
    },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active"
    },
    source: {
      type: String,
      enum: ["manual", "campaign"],
      default: "manual"
    },
    lastUsedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

contactSchema.index({ user: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("Contact", contactSchema);
