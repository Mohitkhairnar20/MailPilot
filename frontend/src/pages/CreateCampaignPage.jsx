import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import apiClient from "../api/client";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const steps = [
  { key: "audience", label: "Audience" },
  { key: "content", label: "Content" },
  { key: "preview", label: "Personalization Preview" },
  { key: "schedule", label: "Schedule" },
  { key: "review", label: "Review" },
  { key: "send", label: "Send" }
];

const initialState = {
  title: "",
  subject: "",
  content: "",
  templatePrompt: "",
  scheduleAt: "",
  deliveryMode: "processing"
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeNameFromEmail(email) {
  const localPart = email.split("@")[0] || "recipient";
  return localPart
    .replace(/[._-]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function splitRecipientTokens(raw) {
  return raw
    .split(/[\n;]+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .flatMap((segment) => {
      const pieces = segment.split(",").map((part) => part.trim()).filter(Boolean);
      const isNameEmailPair = pieces.length === 2 && !pieces[0].includes("@") && pieces[1].includes("@");

      if (segment.includes("<") && segment.includes(">")) {
        return [segment];
      }

      if (isNameEmailPair) {
        return [segment];
      }

      if (pieces.length > 1) {
        return pieces;
      }

      return [segment];
    });
}

function parseRecipientToken(token) {
  const cleaned = token.trim().replace(/^[,;]+|[,;]+$/g, "");

  if (!cleaned) {
    return null;
  }

  let name = "";
  let email = cleaned;

  const angleMatch = cleaned.match(/^(.*)<([^>]+)>$/);
  if (angleMatch) {
    name = angleMatch[1].trim().replace(/^"|"$/g, "");
    email = angleMatch[2].trim();
  } else {
    const parts = cleaned.split(",").map((part) => part.trim());
    if (parts.length === 2 && !parts[0].includes("@") && parts[1].includes("@")) {
      name = parts[0];
      email = parts[1];
    }
  }

  const normalizedEmail = email.toLowerCase();
  if (!emailPattern.test(normalizedEmail)) {
    return {
      valid: false,
      invalid: {
        id: createId(),
        raw: cleaned,
        message: "Invalid email format"
      }
    };
  }

  return {
    valid: true,
    recipient: {
      id: createId(),
      name: name || normalizeNameFromEmail(normalizedEmail),
      email: normalizedEmail,
      company: "",
      role: ""
    }
  };
}

function parseRecipientBatch(raw, existingEmails) {
  const tokens = splitRecipientTokens(raw);
  const validRecipients = [];
  const invalidRecipients = [];

  tokens.forEach((token) => {
    const parsed = parseRecipientToken(token);

    if (!parsed) {
      return;
    }

    if (!parsed.valid) {
      invalidRecipients.push(parsed.invalid);
      return;
    }

    if (!existingEmails.has(parsed.recipient.email)) {
      existingEmails.add(parsed.recipient.email);
      validRecipients.push(parsed.recipient);
    }
  });

  return {
    validRecipients,
    invalidRecipients
  };
}

function renderTemplate(template, recipient) {
  const safeRecipient = recipient || {};
  const firstName = (safeRecipient.name || "").trim().split(" ")[0] || "there";
  const replacements = {
    name: safeRecipient.name || "there",
    firstName,
    email: safeRecipient.email || "",
    company: safeRecipient.company || "",
    role: safeRecipient.role || ""
  };

  return (template || "").replace(/{{\s*([a-zA-Z]+)\s*}}/g, (_, key) => replacements[key] ?? "");
}

function CreateCampaignPage() {
  const [formData, setFormData] = useState(initialState);
  const [recipients, setRecipients] = useState([]);
  const [invalidRecipients, setInvalidRecipients] = useState([]);
  const [recipientInput, setRecipientInput] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [contentMode, setContentMode] = useState("manual");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const previewRecipients = recipients.slice(0, 3);

  useEffect(() => {
    let cancelled = false;

    const loadTemplates = async () => {
      setIsLoadingTemplates(true);

      try {
        const response = await apiClient.get("/templates");

        if (!cancelled) {
          setTemplates(response.data.data || []);
        }
      } catch (_requestError) {
        if (!cancelled) {
          setTemplates([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTemplates(false);
        }
      }
    };

    loadTemplates();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const upsertRecipientsFromRaw = (raw, options = {}) => {
    const { clearInput = false } = options;
    const normalizedRaw = raw.trim();

    if (!normalizedRaw) {
      return {
        nextRecipients: recipients,
        nextInvalidRecipients: invalidRecipients
      };
    }

    const knownEmails = new Set(recipients.map((recipient) => recipient.email));
    const parsed = parseRecipientBatch(normalizedRaw, knownEmails);
    const nextRecipients = [...recipients, ...parsed.validRecipients];

    const knownInvalid = new Set(invalidRecipients.map((entry) => entry.raw.toLowerCase()));
    const nextInvalidRecipients = [...invalidRecipients];

    parsed.invalidRecipients.forEach((entry) => {
      const key = entry.raw.toLowerCase();
      if (!knownInvalid.has(key)) {
        knownInvalid.add(key);
        nextInvalidRecipients.push(entry);
      }
    });

    setRecipients(nextRecipients);
    setInvalidRecipients(nextInvalidRecipients);

    if (clearInput) {
      setRecipientInput("");
    }

    return {
      nextRecipients,
      nextInvalidRecipients
    };
  };

  const commitRecipientInput = () => {
    if (!recipientInput.trim()) {
      return;
    }

    upsertRecipientsFromRaw(recipientInput, { clearInput: true });
  };

  const handleRecipientKeyDown = (event) => {
    const shouldTokenize = event.key === "Enter" || event.key === "Tab" || (event.key === "," && recipientInput.includes("@"));

    if (shouldTokenize) {
      event.preventDefault();
      commitRecipientInput();
      return;
    }

    if (event.key === "Backspace" && !recipientInput && recipients.length > 0) {
      setRecipients((current) => current.slice(0, -1));
    }
  };

  const handleRecipientPaste = (event) => {
    const pasted = event.clipboardData.getData("text");

    if (!pasted) {
      return;
    }

    event.preventDefault();
    upsertRecipientsFromRaw(pasted);
  };

  const removeRecipient = (id) => {
    setRecipients((current) => current.filter((recipient) => recipient.id !== id));
  };

  const removeInvalidRecipient = (id) => {
    setInvalidRecipients((current) => current.filter((entry) => entry.id !== id));
  };

  const updateRecipientField = (id, field, value) => {
    setRecipients((current) =>
      current.map((recipient) =>
        recipient.id === id
          ? {
              ...recipient,
              [field]: value
            }
          : recipient
      )
    );
  };

  const handleGenerateTemplate = async () => {
    setMessage("");
    setError("");


    if (!formData.templatePrompt.trim()) {
      setError("Add an AI prompt before generating a template.");
      return;
    }

    let nextRecipients = recipients;

    if (recipientInput.trim()) {
      const merged = upsertRecipientsFromRaw(recipientInput, { clearInput: true });
      nextRecipients = merged.nextRecipients;
    }

    setIsGeneratingTemplate(true);

    try {
      const response = await apiClient.post("/campaigns/generate-template", {
        title: formData.title,
        prompt: formData.templatePrompt,
        sampleRecipients: nextRecipients.slice(0, 3).map((recipient) => ({
          name: recipient.name,
          email: recipient.email,
          company: recipient.company,
          role: recipient.role
        }))
      });

      setFormData((current) => ({
        ...current,
        subject: response.data?.data?.subject || current.subject,
        content: response.data?.data?.content || current.content
      }));
      setMessage(
        response.data?.data?.source === "fallback"
          ? "OpenAI generation is unavailable for the current key, so MailPilot created a fallback draft from your prompt. Review and edit it before continuing."
          : "AI draft generated. Review and edit the subject and content before continuing."
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to generate an AI template.");
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  const handleTemplateSelect = async (templateId) => {
    setSelectedTemplateId(templateId);
    setMessage("");
    setError("");

    if (!templateId) {
      return;
    }

    const selectedTemplate = templates.find((template) => template._id === templateId);

    if (!selectedTemplate) {
      return;
    }

    setTemplateName(selectedTemplate.name || "");
    setContentMode(selectedTemplate.source === "ai" ? "ai" : "manual");
    setFormData((current) => ({
      ...current,
      subject: selectedTemplate.subject || "",
      content: selectedTemplate.content || "",
      templatePrompt: selectedTemplate.prompt || current.templatePrompt
    }));

    try {
      await apiClient.patch(`/templates/${templateId}/use`);
      setTemplates((current) =>
        current.map((template) =>
          template._id === templateId
            ? {
                ...template,
                lastUsedAt: new Date().toISOString()
              }
            : template
        )
      );
    } catch (_requestError) {
      // Usage tracking is non-blocking for editor population.
    }

    setMessage(`Loaded template "${selectedTemplate.name}" into the editor.`);
  };

  const handleSaveTemplate = async () => {
    setMessage("");
    setError("");

    const name = templateName.trim() || formData.title.trim();

    if (!name) {
      setError("Add a template name or campaign title before saving to the library.");
      return;
    }

    if (!formData.subject.trim() || !formData.content.trim()) {
      setError("Subject and content are required before saving a template.");
      return;
    }

    setIsSavingTemplate(true);

    const payload = {
      name,
      subject: formData.subject,
      content: formData.content,
      prompt: formData.templatePrompt,
      source: contentMode === "ai" ? "ai" : "manual"
    };

    try {
      const response = selectedTemplateId
        ? await apiClient.put(`/templates/${selectedTemplateId}`, payload)
        : await apiClient.post("/templates", payload);

      const savedTemplate = response.data.data;

      setTemplates((current) => {
        const exists = current.some((template) => template._id === savedTemplate._id);
        if (exists) {
          return current.map((template) => (template._id === savedTemplate._id ? savedTemplate : template));
        }

        return [savedTemplate, ...current];
      });

      setSelectedTemplateId(savedTemplate._id);
      setTemplateName(savedTemplate.name || name);
      setMessage(
        selectedTemplateId
          ? `Updated template "${savedTemplate.name}".`
          : `Saved template "${savedTemplate.name}" to your library.`
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save the template.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const validateStep = (stepIndex) => {
    let nextRecipients = recipients;
    let nextInvalidRecipients = invalidRecipients;

    if (stepIndex === 0) {
      if (recipientInput.trim()) {
        const merged = upsertRecipientsFromRaw(recipientInput, { clearInput: true });
        nextRecipients = merged.nextRecipients;
        nextInvalidRecipients = merged.nextInvalidRecipients;
      }

      if (nextRecipients.length === 0) {
        setError("Add at least one recipient in the Audience step.");
        return false;
      }

      if (nextInvalidRecipients.length > 0) {
        setError("Remove invalid recipient entries before continuing.");
        return false;
      }
    }

    if (stepIndex === 1) {
      if (!formData.title.trim() || !formData.subject.trim() || !formData.content.trim()) {
        setError("Campaign title, subject, and content are required before preview.");
        return false;
      }
    }

    if (stepIndex === 3) {
      if (formData.deliveryMode === "scheduled" && !formData.scheduleAt) {
        setError("Select a schedule date and time for scheduled delivery.");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    setMessage("");
    setError("");

    if (!validateStep(currentStep)) {
      return;
    }

    setCurrentStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const handleBack = () => {
    setMessage("");
    setError("");
    setCurrentStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async () => {
    setMessage("");
    setError("");

    let finalRecipients = recipients;
    let finalInvalidRecipients = invalidRecipients;

    if (recipientInput.trim()) {
      const merged = upsertRecipientsFromRaw(recipientInput, { clearInput: true });
      finalRecipients = merged.nextRecipients;
      finalInvalidRecipients = merged.nextInvalidRecipients;
    }

    if (finalRecipients.length === 0) {
      setError("Add at least one recipient before sending.");
      return;
    }

    if (finalInvalidRecipients.length > 0) {
      setError("Remove invalid recipient entries before sending.");
      return;
    }

    if (!formData.title.trim() || !formData.subject.trim() || !formData.content.trim()) {
      setError("Complete campaign content before sending.");
      setCurrentStep(1);
      return;
    }

    if (formData.deliveryMode === "scheduled" && !formData.scheduleAt) {
      setError("Pick a schedule date and time.");
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post("/campaigns", {
        title: formData.title,
        subject: formData.subject,
        content: formData.content,
        recipients: finalRecipients.map((recipient) => ({
          name: recipient.name,
          email: recipient.email,
          company: recipient.company,
          role: recipient.role
        })),
        scheduleAt: formData.deliveryMode === "scheduled" ? formData.scheduleAt : null,
        status: formData.deliveryMode
      });

      setMessage("Campaign created successfully and queued for delivery.");
      setFormData(initialState);
      setContentMode("manual");
      setSelectedTemplateId("");
      setTemplateName("");
      setRecipients([]);
      setInvalidRecipients([]);
      setRecipientInput("");
      setCurrentStep(0);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create the campaign.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Composer"
        title="Campaign Wizard"
        description="Create and send campaigns with a guided 6-step flow."
      />

      <div className="rounded-[1.4rem] border border-[#e9dfd3] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5">
        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {steps.map((step, index) => {
            const isActive = currentStep === index;
            const isComplete = currentStep > index;

            return (
              <button
                key={step.key}
                type="button"
                onClick={() => {
                  if (index <= currentStep) {
                    setCurrentStep(index);
                    setError("");
                  }
                }}
                className={`rounded-xl border px-3 py-2 text-left transition ${
                  isActive
                    ? "border-[#132238] bg-[#132238] text-white"
                    : isComplete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-[#ece4d8] bg-[#fcfaf7] text-slate-500"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Step {index + 1}</p>
                <p className="mt-1 text-sm font-semibold">{step.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-slate-200/70 bg-white/90 p-6 shadow-sm">
        {currentStep === 0 ? (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Step 1</p>
              <h2 className="mt-2 font-display text-[1.8rem] text-ink">Audience</h2>
              <p className="mt-2 text-slate-600">Add recipients with Gmail-like chips. Supports Enter, comma, or paste.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none transition focus-within:border-coral">
              <div className="flex flex-wrap gap-2">
                {recipients.map((recipient) => (
                  <span key={recipient.id} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
                    <span className="font-semibold">{recipient.name}</span>
                    <span className="text-emerald-700">{recipient.email}</span>
                    <button
                      type="button"
                      onClick={() => removeRecipient(recipient.id)}
                      className="rounded-full px-1 text-emerald-700 transition hover:bg-emerald-100"
                      aria-label={`Remove ${recipient.email}`}
                    >
                      x
                    </button>
                  </span>
                ))}

                {invalidRecipients.map((entry) => (
                  <span key={entry.id} className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700">
                    <span>{entry.raw}</span>
                    <button
                      type="button"
                      onClick={() => removeInvalidRecipient(entry.id)}
                      className="rounded-full px-1 transition hover:bg-rose-100"
                      aria-label={`Remove invalid ${entry.raw}`}
                    >
                      x
                    </button>
                  </span>
                ))}

                <input
                  className="min-w-[220px] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-slate-400"
                  value={recipientInput}
                  onChange={(event) => setRecipientInput(event.target.value)}
                  onKeyDown={handleRecipientKeyDown}
                  onPaste={handleRecipientPaste}
                  onBlur={commitRecipientInput}
                  placeholder="Type email or name,email and press Enter"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Examples: <code>rahul@example.com</code>, <code>Rahul,rahul@example.com</code>,{" "}
                <code>{"Rahul <rahul@example.com>"}</code>
              </span>
              <span>{recipients.length} valid</span>
            </div>
          </div>
        ) : null}

        {currentStep === 1 ? (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Step 2</p>
              <h2 className="mt-2 font-display text-[1.8rem] text-ink">Content</h2>
              <p className="mt-2 text-slate-600">Write the template yourself or have AI draft it from your prompt, then edit the result manually.</p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Campaign title</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-coral"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </label>

            <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-[#fcfaf7] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Template library</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Load a saved draft or store the current subject and content for reuse.
                      </p>
                    </div>
                    <Link to="/app/templates" className="text-sm font-semibold text-coral">
                      Open library
                    </Link>
                  </div>

                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Load template</span>
                      <select
                        value={selectedTemplateId}
                        onChange={(event) => handleTemplateSelect(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-coral"
                        disabled={isLoadingTemplates}
                      >
                        <option value="">{isLoadingTemplates ? "Loading templates..." : "Select a saved template"}</option>
                        {templates.map((template) => (
                          <option key={template._id} value={template._id}>
                            {template.name} ({template.source})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Template name</span>
                      <input
                        value={templateName}
                        onChange={(event) => setTemplateName(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-coral"
                        placeholder="Founders outreach v1"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      disabled={isSavingTemplate}
                      className="rounded-xl bg-[#132238] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingTemplate ? "Saving template..." : selectedTemplateId ? "Update template" : "Save to library"}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-[#fcfaf7] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Template mode</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setContentMode("manual")}
                      className={contentMode === "manual" ? "rounded-xl border border-[#132238] bg-[#132238] px-4 py-3 text-left text-white transition" : "rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 transition"}
                    >
                      <p className="text-sm font-semibold">Manual</p>
                      <p className={contentMode === "manual" ? "mt-1 text-xs text-slate-300" : "mt-1 text-xs text-slate-500"}>
                        Type subject and content directly.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentMode("ai")}
                      className={contentMode === "ai" ? "rounded-xl border border-[#132238] bg-[#132238] px-4 py-3 text-left text-white transition" : "rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 transition"}
                    >
                      <p className="text-sm font-semibold">AI assisted</p>
                      <p className={contentMode === "ai" ? "mt-1 text-xs text-slate-300" : "mt-1 text-xs text-slate-500"}>
                        Generate a draft from a prompt, then edit it.
                      </p>
                    </button>
                  </div>
                </div>

                {contentMode === "ai" ? (
                  <div className="rounded-2xl border border-slate-200 bg-[#fcfaf7] p-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">AI prompt</span>
                      <textarea
                        className="min-h-40 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-coral"
                        name="templatePrompt"
                        value={formData.templatePrompt}
                        onChange={handleChange}
                        placeholder="Write a short product introduction email for technical prospects. Mention the value clearly, keep it concise, and use placeholders where helpful."
                      />
                    </label>
                    <p className="mt-3 text-sm text-slate-500">
                      MailPilot uses your prompt, the optional campaign title, and your first few recipients as context. Generated output is still editable.
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateTemplate}
                      disabled={isGeneratingTemplate}
                      className="mt-4 rounded-xl bg-[#132238] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isGeneratingTemplate ? "Generating draft..." : "Generate draft with AI"}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-[#fcfaf7] p-4 text-sm text-slate-600">
                    Manual mode keeps the existing workflow. Type the subject and body directly, then continue to preview.
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-[#fcfaf7] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Supported placeholders</p>
                  <p className="mt-2 text-sm text-slate-600">
                    <code>{"{{name}}"}</code>, <code>{"{{firstName}}"}</code>, <code>{"{{email}}"}</code>, <code>{"{{company}}"}</code>, <code>{"{{role}}"}</code>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Email subject</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-coral"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Introducing MailPilot for {{company}}"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Email content</span>
                  <textarea
                    className="min-h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-coral"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="Hello {{firstName}},\n\nI wanted to share..."
                    required
                  />
                </label>
              </div>
            </div>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Step 3</p>
              <h2 className="mt-2 font-display text-[1.8rem] text-ink">Live Personalization Preview</h2>
              <p className="mt-2 text-slate-600">Check how your variables render across multiple recipients before you send anything.</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-[#fcfaf7] p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Template variables</p>
                  <p className="mt-2 text-sm text-slate-600">
                    <code>{"{{name}}"}</code>, <code>{"{{firstName}}"}</code>, <code>{"{{email}}"}</code>,{" "}
                    <code>{"{{company}}"}</code>, <code>{"{{role}}"}</code>
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Current content template</p>
                  <pre className="mt-3 whitespace-pre-wrap font-mono text-sm text-slate-700">
                    {formData.content || "Hello {{name}},\nwelcome to {{company}}"}
                  </pre>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Preview data</p>
                <p className="mt-2 text-sm text-slate-600">Fill in company and role for the first recipients so the preview reflects what users will receive.</p>

                {previewRecipients.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {previewRecipients.map((recipient) => (
                      <div key={recipient.id} className="rounded-2xl border border-slate-200 bg-[#fcfaf7] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-ink">{recipient.name}</p>
                            <p className="text-sm text-slate-500">{recipient.email}</p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 shadow-sm">
                            Live sample
                          </span>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Company</span>
                            <input
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-coral"
                              value={recipient.company}
                              onChange={(event) => updateRecipientField(recipient.id, "company", event.target.value)}
                              placeholder="Google"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Role</span>
                            <input
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-coral"
                              value={recipient.role}
                              onChange={(event) => updateRecipientField(recipient.id, "role", event.target.value)}
                              placeholder="Software Intern"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">Add recipients in Step 1 to unlock live preview cards.</p>
                )}
              </div>
            </div>

            {previewRecipients.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Example previews</p>
                <div className="grid gap-4 xl:grid-cols-2">
                  {previewRecipients.map((recipient) => (
                    <div key={`preview-${recipient.id}`} className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Preview for {recipient.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{recipient.company || "No company added yet"}</p>
                        </div>
                        <span className="rounded-full bg-[#fff1e5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d16d35]">
                          Live render
                        </span>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-[#fcfaf7] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Subject</p>
                        <p className="mt-2 text-sm font-medium text-ink">
                          {renderTemplate(formData.subject, recipient) || "(No subject yet)"}
                        </p>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-[#fcfaf7] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Body preview</p>
                        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-700">
                          {renderTemplate(formData.content, recipient) || "(No content yet)"}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {currentStep === 3 ? (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Step 4</p>
              <h2 className="mt-2 font-display text-[1.8rem] text-ink">Schedule</h2>
              <p className="mt-2 text-slate-600">Choose immediate send, scheduled send, or draft save.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { value: "processing", label: "Send immediately", helper: "Queue emails now" },
                { value: "scheduled", label: "Schedule", helper: "Send at a future time" },
                { value: "draft", label: "Save draft", helper: "Do not queue yet" }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData((current) => ({ ...current, deliveryMode: option.value }))}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    formData.deliveryMode === option.value
                      ? "border-[#132238] bg-[#132238] text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className={`mt-1 text-xs ${formData.deliveryMode === option.value ? "text-slate-300" : "text-slate-500"}`}>{option.helper}</p>
                </button>
              ))}
            </div>

            {formData.deliveryMode === "scheduled" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Schedule date and time</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-coral"
                  type="datetime-local"
                  name="scheduleAt"
                  value={formData.scheduleAt}
                  onChange={handleChange}
                />
              </label>
            ) : null}
          </div>
        ) : null}

        {currentStep === 4 ? (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Step 5</p>
              <h2 className="mt-2 font-display text-[1.8rem] text-ink">Review</h2>
              <p className="mt-2 text-slate-600">Verify campaign details before final send.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-[#fcfaf7] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Campaign</p>
                <p className="mt-2 text-sm text-slate-700"><span className="font-semibold">Title:</span> {formData.title || "-"}</p>
                <p className="mt-1 text-sm text-slate-700"><span className="font-semibold">Subject:</span> {formData.subject || "-"}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-[#fcfaf7] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Delivery</p>
                <p className="mt-2 text-sm text-slate-700"><span className="font-semibold">Mode:</span> {formData.deliveryMode}</p>
                <p className="mt-1 text-sm text-slate-700"><span className="font-semibold">Schedule:</span> {formData.deliveryMode === "scheduled" ? formData.scheduleAt || "Missing" : "Not scheduled"}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-[#fcfaf7] p-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Audience summary</p>
                <p className="mt-2 text-sm text-slate-700"><span className="font-semibold">Valid recipients:</span> {recipients.length}</p>
                <p className="mt-1 text-sm text-slate-700"><span className="font-semibold">Invalid entries:</span> {invalidRecipients.length}</p>
              </div>
            </div>
          </div>
        ) : null}

        {currentStep === 5 ? (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Step 6</p>
              <h2 className="mt-2 font-display text-[1.8rem] text-ink">Send</h2>
              <p className="mt-2 text-slate-600">Final confirmation. Once sent, emails are queued based on your selected delivery mode.</p>
            </div>

            <div className="rounded-2xl border border-[#e8dfd3] bg-[#fcfaf7] p-4">
              <p className="text-sm text-slate-700">
                Ready to {formData.deliveryMode === "draft" ? "save draft" : "send"} <span className="font-semibold">{formData.title || "Untitled campaign"}</span> to <span className="font-semibold">{recipients.length}</span> recipients.
              </p>
            </div>
          </div>
        ) : null}

        {message ? <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e8dd] pt-5">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            className="rounded-xl border border-[#e3d8ca] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#faf6f0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="rounded-xl bg-[#132238] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next step
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-xl bg-[#132238] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Create campaign"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default CreateCampaignPage;













