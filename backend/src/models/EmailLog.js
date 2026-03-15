const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    recipientName: {
      type: String,
      trim: true,
      default: ""
    },
    subject: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["queued", "sent", "failed"],
      default: "queued"
    },
    attempts: {
      type: Number,
      default: 0
    },
    sentAt: Date,
    lastAttemptAt: Date,
    providerMessageId: String,
    accepted: {
      type: [String],
      default: []
    },
    rejected: {
      type: [String],
      default: []
    },
    response: String,
    lastError: String
  },
  {
    timestamps: true
  }
);

emailLogSchema.index({ campaign: 1, recipientEmail: 1 }, { unique: true });

module.exports = mongoose.model("EmailLog", emailLogSchema);
