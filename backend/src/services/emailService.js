const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 2525),
  secure: Number(process.env.SMTP_PORT || 2525) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const verifyEmailTransport = async () => {
  return transporter.verify();
};

const sendCampaignEmail = async ({ to, subject, html, text, metadata = {} }) => {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
    text,
    headers: {
      "X-MailPilot-Campaign": metadata.campaignId || "",
      "X-MailPilot-Recipient": metadata.recipientEmail || ""
    }
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response
  };
};

module.exports = { sendCampaignEmail, verifyEmailTransport };
