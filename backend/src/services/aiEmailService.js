const { parse } = require("csv-parse/sync");

const requiredCsvHeaders = ["name", "email", "company", "role"];
const groqApiKey = process.env.GROQ_API_KEY || "";
const groqModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

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

  return rows.map((row, index) => {
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
};

const extractJsonPayload = (responseText) => {
  const fencedMatch = String(responseText || "").match(/```json\s*([\s\S]*?)```/i);
  const rawJson = fencedMatch ? fencedMatch[1] : responseText;
  return JSON.parse(rawJson);
};

const toSentenceCase = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const cleanPromptIdea = (prompt) =>
  String(prompt || "")
    .replace(/^(please\s+)?(generate|write|create|draft)\s+(an?\s+)?(email|message|campaign|draft)\s+(that\s+)?/i, "")
    .replace(/^(for\s+me\s+)?to\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.?!]+$/, "");

const derivePromptSummary = (prompt) => {
  const cleaned = cleanPromptIdea(prompt);

  if (!cleaned) {
    return "I wanted to share a quick introduction and explain why this could be relevant for you.";
  }

  const introduceMatch = cleaned.match(/introduc(?:e|ing)\s+(.+?)(?:\s+to\s+.+)?$/i);
  if (introduceMatch?.[1]) {
    return `I wanted to introduce ${introduceMatch[1].trim()} and share why it may be useful for you.`;
  }

  const shareMatch = cleaned.match(/share\s+(.+)$/i);
  if (shareMatch?.[1]) {
    return `I wanted to share ${shareMatch[1].trim()} and provide a quick overview.`;
  }

  return `${toSentenceCase(cleaned)}.`;
};

const deriveFallbackSubject = ({ title, prompt }) => {
  if (title?.trim()) {
    return title.trim();
  }

  const cleaned = cleanPromptIdea(prompt);
  const introduceMatch = cleaned.match(/introduc(?:e|ing)\s+(.+?)(?:\s+to\s+.+)?$/i);

  if (introduceMatch?.[1]) {
    return `Introducing ${toSentenceCase(introduceMatch[1].trim())}`;
  }

  return "Quick introduction from MailPilot";
};

const buildFallbackEmail = ({ recipient, subject, prompt }) => {
  const intro = `Hello ${escapeHtml(recipient.name)},`;
  const companyLine = recipient.company ? ` for ${escapeHtml(recipient.company)}` : "";
  const roleLine = recipient.role ? `, especially for ${escapeHtml(recipient.role)} workflows` : "";
  const summary = escapeHtml(derivePromptSummary(prompt));

  return {
    ...recipient,
    personalizedSubject: subject,
    personalizedContent: `<p>${intro}</p><p>${summary}</p><p>I thought this could be relevant${companyLine}${roleLine}.</p><p>If you'd like, I'm happy to share a quick overview or next steps.</p><p>Best regards,<br />MailPilot</p>`
  };
};

const buildFallbackTemplate = ({ title, prompt, sampleRecipients = [] }) => {
  const sampleRecipient = sampleRecipients[0] || {};
  const greetingVariable = sampleRecipient.name ? "{{firstName}}" : "{{name}}";
  const companyReference = sampleRecipient.company ? " for {{company}}" : "";
  const roleReference = sampleRecipient.role ? ", especially for {{role}} workflows" : "";
  const summary = derivePromptSummary(prompt);

  return {
    subject: deriveFallbackSubject({ title, prompt }),
    content: `Hello ${greetingVariable},\n\n${summary}\n\nI thought this could be relevant${companyReference}${roleReference}.\n\nIf you'd like, I can share a quick overview or next steps.\n\nBest regards,\nMailPilot`
  };
};

const callGroqJson = async ({ prompt, schemaDescription }) => {
  if (!groqApiKey) {
    throw new Error("Groq API key is missing");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqApiKey}`
    },
    body: JSON.stringify({
      model: groqModel,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a concise assistant that returns valid JSON only."
        },
        {
          role: "user",
          content: `${prompt}\n\nReturn JSON only. ${schemaDescription}`
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const outputText = payload?.choices?.[0]?.message?.content?.trim();

  if (!outputText) {
    throw new Error("Groq returned an empty response");
  }

  return extractJsonPayload(outputText);
};

const generatePersonalizedEmails = async ({ subject, prompt, recipients }) => {
  if (!groqApiKey) {
    return recipients.map((recipient) => buildFallbackEmail({ recipient, subject, prompt }));
  }

  try {
    const payload = await callGroqJson({
      prompt: `Generate concise personalized outreach emails.

Base subject: ${subject}
Base prompt: ${prompt}

For each recipient below, generate:
- personalizedSubject
- personalizedContent as HTML starting with a greeting that uses their name
- keep the layout readable on mobile
- use short paragraphs with spacing
- include at most one short bullet list only when useful
- end with a brief CTA and a professional sign-off
- avoid markdown, fake links, bracket placeholders, or giant text blocks

Recipients:
${JSON.stringify(recipients, null, 2)}`,
      schemaDescription:
        'Use this exact shape: {"emails":[{"email":"user@example.com","personalizedSubject":"...","personalizedContent":"<p>Hello Name,</p>..."}]}'
    });

    const emailMap = new Map(
      (payload.emails || []).map((item) => [String(item.email || "").trim().toLowerCase(), item])
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
  } catch (_error) {
    return recipients.map((recipient) => buildFallbackEmail({ recipient, subject, prompt }));
  }
};

const generateCampaignTemplate = async ({ title, prompt, recipientCount = 0, sampleRecipients = [] }) => {
  const fallbackTemplate = () => ({
    ...buildFallbackTemplate({ title, prompt, sampleRecipients }),
    source: "fallback"
  });

  if (!groqApiKey) {
    return fallbackTemplate();
  }

  try {
    const payload = await callGroqJson({
      prompt: `Create a concise, professional email campaign template.

Campaign title: ${title || "Untitled campaign"}
User prompt: ${prompt}
Recipient count: ${recipientCount}
Sample recipients:
${JSON.stringify(sampleRecipients, null, 2)}

Generate:
- a subject line
- a plain text body suitable for editing in a textarea
- placeholders such as {{name}}, {{firstName}}, {{company}}, {{role}}, and {{email}} only when they improve personalization
- structure the body with:
  greeting
  short intro paragraph
  one to three short value points
  short CTA
  professional sign-off
- keep the content easy to read on mobile with blank lines between sections
- avoid markdown, fake links, and long unbroken paragraphs`,
      schemaDescription: 'Use this exact shape: {"subject":"...","content":"..."}'
    });

    if (!payload?.subject || !payload?.content) {
      return fallbackTemplate();
    }

    return {
      subject: String(payload.subject).trim(),
      content: String(payload.content).trim(),
      source: "ai"
    };
  } catch (_error) {
    return fallbackTemplate();
  }
};

module.exports = {
  parseRecipientsCsv,
  generatePersonalizedEmails,
  generateCampaignTemplate
};
