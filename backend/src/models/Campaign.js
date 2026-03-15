const mongoose = require("mongoose");

const recipientSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true
    },
    name: {
      type: String
    },
    company: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      default: ""
    },
    personalizedSubject: {
      type: String,
      default: ""
    },
    personalizedContent: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const campaignSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    recipients: {
      type: [recipientSchema],
      default: []
    },
    scheduleAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "processing", "sent", "failed"],
      default: "draft"
    },
    analytics: {
      totalSent: {
        type: Number,
        default: 0
      },
      openRate: {
        type: Number,
        default: 0
      },
      clickRate: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Campaign", campaignSchema);
