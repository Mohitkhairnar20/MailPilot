const { parse } = require("csv-parse/sync");
const OpenAI = require("openai");

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const requiredCsvHeaders = ["name", "email", "company", "role"];

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const parseRecipientsCsv = async (buffer) => {
  const rows = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  if (!rows.length) {
    return [];
  }

  const firstRowHeaders = Object.keys(rows[0]).map((header) => header.trim().toLowerCase());
  const missingHeaders = requiredCsvHeaders.filter((header) => !firstRowHeaders.includes(header));
  if (missingHeaders.length) {
    throw new Error(`CSV is missing required columns: ${missingHeaders.join(", ")}`);
  }

  const recipients = rows.map((row, index) => {
    const recipient = {
      name: (row.name || "").trim(),
      email: (row.email || "").trim().toLowerCase(),
      company: (row.company || "").trim(),
      role: (row.role || "").trim()
    };

    if (!recipient.name || !recipient.email) {
      throw new Error(`Row ${index + 2} is missing a name or email`);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) {
      throw new Error(`Row ${index + 2} has an invalid email address`);
    }

    return recipient;
  });

  return recipients;
};

const extractJsonPayload = (responseText) => {
  const fencedMatch = responseText.match(/```json\s*([\s\S]*?)```/i);
  const rawJson = fencedMatch ? fencedMatch[1] : responseText;
  return JSON.parse(rawJson);
};

const buildFallbackEmail = ({ recipient, subject, prompt }) => {
  const intro = `Hello ${escapeHtml(recipient.name)},`;
  const companyLine = recipient.company ? ` at ${escapeHtml(recipient.company)}` : "";
  const roleLine = recipient.role ? ` for the ${escapeHtml(recipient.role)} opportunity` : "";

  return {
    ...recipient,
    personalizedSubject: subject,
    personalizedContent: `<p>${intro}</p><p>${escapeHtml(prompt)}</p><p>I am excited to apply${roleLine}${companyLine}.</p><p>Best regards,<br />MailPilot User</p>`
  };
};

const buildFallbackTemplate = ({ title, prompt, sampleRecipients = [] }) => {
  const sampleRecipient = sampleRecipients[0] || {};
  const greetingVariable = sampleRecipient.name ? "{{firstName}}" : "{{name}}";
  const companyReference = sampleRecipient.company ? " at {{company}}" : "";
  const roleReference = sampleRecipient.role ? " for the {{role}} role" : "";

  return {
    subject: title?.trim() || "MailPilot outreach",
    content: `Hello ${greetingVariable},\n\n${prompt}\n\nI wanted to reach out${roleReference}${companyReference} and share a relevant update with you.\n\nBest regards,\nMailPilot`
  };
};

const generatePersonalizedEmails = async ({ subject, prompt, recipients }) => {
  if (!client) {
    return recipients.map((recipient) => buildFallbackEmail({ recipient, subject, prompt }));
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  let response;

  try {
    response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You generate concise personalized outreach emails. Return valid JSON only."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Base subject: ${subject}
Base prompt: ${prompt}

For each recipient below, generate:
- personalizedSubject
- personalizedContent as HTML starting with a greeting using their name

Return JSON in this exact shape:
{"emails":[{"email":"user@example.com","personalizedSubject":"...","personalizedContent":"<p>Hello Name,</p>..."}]}

Recipients:
${JSON.stringify(recipients, null, 2)}`
            }
          ]
        }
      ]
    });
  } catch (error) {
    return recipients.map((recipient) => buildFallbackEmail({ recipient, subject, prompt }));
  }

  const responseText = response.output_text;
  let aiPayload;

  try {
    aiPayload = extractJsonPayload(responseText);
  } catch (error) {
    return recipients.map((recipient) => buildFallbackEmail({ recipient, subject, prompt }));
  }

  const emailMap = new Map(
    (aiPayload.emails || []).map((item) => [String(item.email || "").trim().toLowerCase(), item])
  );

  return recipients.map((recipient) => {
    const aiEmail = emailMap.get(recipient.email);

    if (!aiEmail?.personalizedContent) {
      return buildFallbackEmail({ recipient, subject, prompt });
    }

    return {
      ...recipient,
      personalizedSubject: aiEmail.personalizedSubject || subject,
      personalizedContent: aiEmail.personalizedContent
    };
  });
};

const generateCampaignTemplate = async ({ title, prompt, recipientCount = 0, sampleRecipients = [] }) => {
  const fallbackTemplate = () => ({
    ...buildFallbackTemplate({ title, prompt, sampleRecipients }),
    source: "fallback"
  });

  if (!client) {
    return fallbackTemplate();
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  let response;

  try {
    response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You create email campaign templates. Return valid JSON only. The JSON shape must be {\"subject\":\"...\",\"content\":\"...\"}. Content must be plain text, not HTML. Use placeholders like {{name}}, {{firstName}}, {{company}}, {{role}}, and {{email}} only when they improve personalization."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Campaign title: ${title || "Untitled campaign"}
User prompt: ${prompt}
Recipient count: ${recipientCount}
Sample recipients:
${JSON.stringify(sampleRecipients, null, 2)}

Generate a concise, professional email template with:
- a subject line
- a body suitable for editing in a textarea
- placeholders where appropriate

Return JSON only.`
            }
          ]
        }
      ]
    });
  } catch (error) {
    return fallbackTemplate();
  }

  try {
    const payload = extractJsonPayload(response.output_text);

    if (!payload?.subject || !payload?.content) {
      return fallbackTemplate();
    }

    return {
      subject: String(payload.subject).trim(),
      content: String(payload.content).trim(),
      source: "ai"
    };
  } catch (error) {
    return fallbackTemplate();
  }
};

module.exports = {
  parseRecipientsCsv,
  generatePersonalizedEmails,
  generateCampaignTemplate
};
