// Carbone adapter for PDF/document generation.
// Uses Carbone API when CARBONE_API_KEY is set.
// Falls back to HTML-to-string template rendering when not configured.

export interface DocTemplate {
  id: string;
  name: string;
  type: "proposal" | "contract" | "invoice" | "report" | "case-study";
  format: "pdf" | "docx";
  template: string;
  variables: string[];
}

export interface GeneratedDoc {
  id: string;
  tenantId: string;
  templateId: string;
  data: Record<string, string>;
  format: string;
  content: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Pre-built Lead OS document templates
// ---------------------------------------------------------------------------

export const LEAD_OS_DOC_TEMPLATES: Omit<DocTemplate, "id">[] = [
  {
    name: "Service Proposal",
    type: "proposal",
    format: "pdf",
    template: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Service Proposal — {clientName}</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;color:#1a1a1a}h1{color:#0f4c81}table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #ccc}</style></head><body><h1>Service Proposal</h1><p><strong>Prepared for:</strong> {clientName}</p><p><strong>Company:</strong> {company}</p><p><strong>Date:</strong> {date}</p><h2>Scope of Work</h2><p><strong>Niche:</strong> {niche}</p><p><strong>Service:</strong> {service}</p><h2>Investment</h2><p><strong>Total:</strong> ${"{price}"}</p><h2>Guarantee</h2><p>{guarantee}</p><h2>Next Steps</h2><p>Sign and return this proposal to get started.</p></body></html>`,
    variables: ["clientName", "company", "date", "niche", "service", "price", "guarantee"],
  },
  {
    name: "Monthly Report",
    type: "report",
    format: "pdf",
    template: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Monthly Report — {month}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto}h1{color:#0f4c81}table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #ccc}th{background:#f0f4f8}</style></head><body><h1>Monthly Report</h1><p><strong>Client:</strong> {clientName}</p><p><strong>Period:</strong> {month}</p><h2>Results Summary</h2><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody><tr><td>Leads Generated</td><td>{leadsGenerated}</td></tr><tr><td>Calls Booked</td><td>{callsBooked}</td></tr><tr><td>Deals Closed</td><td>{dealsClosed}</td></tr><tr><td>Revenue</td><td>${"{revenue}"}</td></tr></tbody></table><h2>Next Month Goals</h2><p>{nextGoals}</p></body></html>`,
    variables: ["clientName", "month", "leadsGenerated", "callsBooked", "dealsClosed", "revenue", "nextGoals"],
  },
  {
    name: "Lead Handoff",
    type: "report",
    format: "pdf",
    template: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Lead Handoff — {leadName}</title><style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto}h1{color:#0f4c81}</style></head><body><h1>Lead Handoff Report</h1><p><strong>Lead:</strong> {leadName}</p><p><strong>Company:</strong> {leadCompany}</p><p><strong>Email:</strong> {leadEmail}</p><p><strong>Phone:</strong> {leadPhone}</p><h2>Lead Summary</h2><p>{summary}</p><h2>Qualification Notes</h2><p>{notes}</p><h2>Recommended Next Step</h2><p>{nextStep}</p></body></html>`,
    variables: ["leadName", "leadCompany", "leadEmail", "leadPhone", "summary", "notes", "nextStep"],
  },
  {
    name: "Client Contract",
    type: "contract",
    format: "pdf",
    template: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Client Contract</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;line-height:1.6}h1{color:#1a1a1a}hr{margin:24px 0}.signature-block{margin-top:60px;display:flex;justify-content:space-between}</style></head><body><h1>Service Agreement</h1><p><strong>Client:</strong> {clientName}</p><p><strong>Service Provider:</strong> {providerName}</p><p><strong>Start Date:</strong> {startDate}</p><p><strong>Term:</strong> {term}</p><hr><h2>Services</h2><p>{serviceDescription}</p><h2>Compensation</h2><p>{compensation}</p><h2>Guarantee</h2><p>{guarantee}</p><h2>Terms & Conditions</h2><p>Both parties agree to the terms set forth in this agreement. Either party may terminate with 30 days written notice.</p><div class="signature-block"><div><p>Client Signature: _______________</p><p>Date: _______________</p></div><div><p>Provider Signature: _______________</p><p>Date: _______________</p></div></div></body></html>`,
    variables: ["clientName", "providerName", "startDate", "term", "serviceDescription", "compensation", "guarantee"],
  },
  {
    name: "Case Study",
    type: "case-study",
    format: "pdf",
    template: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Case Study — {clientName}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto}h1{color:#0f4c81}blockquote{background:#f0f4f8;padding:16px;border-left:4px solid #0f4c81;margin:16px 0}</style></head><body><h1>Case Study</h1><h2>{clientName} — {niche}</h2><h3>The Challenge</h3><p>{challenge}</p><h3>Our Solution</h3><p>{solution}</p><h3>The Results</h3><p>{results}</p><blockquote><p>"{testimonial}"</p><footer>— {clientName}, {clientTitle}</footer></blockquote></body></html>`,
    variables: ["clientName", "niche", "challenge", "solution", "results", "testimonial", "clientTitle"],
  },
];

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const templateStore = new Map<string, DocTemplate>();
const docStore = new Map<string, GeneratedDoc>();

let nextTemplateIndex = 0;

// Seed with pre-built templates on first use
function ensureTemplatesSeeded(): void {
  if (templateStore.size > 0) return;
  for (const tmpl of LEAD_OS_DOC_TEMPLATES) {
    const id = `tpl_${++nextTemplateIndex}`;
    templateStore.set(id, { id, ...tmpl });
  }
}

export function resetDocStore(): void {
  templateStore.clear();
  docStore.clear();
  nextTemplateIndex = 0;
}

// ---------------------------------------------------------------------------
// Carbone client helpers
// ---------------------------------------------------------------------------

function getCarboneApiKey(): string | null {
  return process.env.CARBONE_API_KEY ?? null;
}

async function carboneRender(
  templateContent: string,
  data: Record<string, string>,
): Promise<string> {
  const apiKey = getCarboneApiKey();
  if (!apiKey) throw new Error("Carbone not configured");

  const uploadRes = await fetch("https://api.carbone.io/template", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ template: Buffer.from(templateContent).toString("base64") }),
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text().catch(() => uploadRes.statusText);
    throw new Error(`Carbone upload error ${uploadRes.status}: ${text}`);
  }

  const { data: uploadData } = (await uploadRes.json()) as { data: { templateId: string } };

  const renderRes = await fetch(`https://api.carbone.io/render/${uploadData.templateId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data }),
  });

  if (!renderRes.ok) {
    const text = await renderRes.text().catch(() => renderRes.statusText);
    throw new Error(`Carbone render error ${renderRes.status}: ${text}`);
  }

  const renderJson = (await renderRes.json()) as { data: { renderId: string } };
  const renderId = renderJson.data.renderId;

  const fileRes = await fetch(`https://api.carbone.io/render/${renderId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!fileRes.ok) {
    throw new Error(`Carbone file error ${fileRes.status}`);
  }

  const buffer = await fileRes.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

// ---------------------------------------------------------------------------
// Internal: HTML template rendering (dry-run fallback)
// ---------------------------------------------------------------------------

function renderHtmlTemplate(
  templateContent: string,
  data: Record<string, string>,
): string {
  let result = templateContent;
  for (const [key, value] of Object.entries(data)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}

function generateDocId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function registerTemplate(
  template: Omit<DocTemplate, "id">,
): DocTemplate {
  ensureTemplatesSeeded();
  const id = `tpl_${++nextTemplateIndex}`;
  const registered: DocTemplate = { id, ...template };
  templateStore.set(id, registered);
  return registered;
}

export function getTemplate(id: string): DocTemplate | undefined {
  ensureTemplatesSeeded();
  return templateStore.get(id);
}

export function listTemplates(type?: string): DocTemplate[] {
  ensureTemplatesSeeded();
  const all = Array.from(templateStore.values());
  if (type) return all.filter((t) => t.type === type);
  return all;
}

export async function generateDocument(
  tenantId: string,
  templateId: string,
  data: Record<string, string>,
): Promise<GeneratedDoc> {
  ensureTemplatesSeeded();
  const template = templateStore.get(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const apiKey = getCarboneApiKey();
  let content: string;

  if (apiKey) {
    content = await carboneRender(template.template, data);
  } else {
    content = renderHtmlTemplate(template.template, data);
  }

  const id = generateDocId();
  const doc: GeneratedDoc = {
    id,
    tenantId,
    templateId,
    data,
    format: template.format,
    content,
    createdAt: new Date().toISOString(),
  };

  docStore.set(id, doc);
  return doc;
}

export async function generateProposal(
  tenantId: string,
  leadData: {
    name: string;
    company?: string;
    niche: string;
    service: string;
    price: number;
    guarantee?: string;
  },
): Promise<GeneratedDoc> {
  ensureTemplatesSeeded();
  const template = Array.from(templateStore.values()).find(
    (t) => t.type === "proposal",
  );
  if (!template) {
    throw new Error("No proposal template registered");
  }

  return generateDocument(tenantId, template.id, {
    clientName: leadData.name,
    company: leadData.company ?? "",
    date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    niche: leadData.niche,
    service: leadData.service,
    price: leadData.price.toFixed(2),
    guarantee: leadData.guarantee ?? "30-day money-back guarantee",
  });
}

export async function generateInvoice(
  tenantId: string,
  invoiceData: {
    clientName: string;
    items: { description: string; amount: number }[];
    dueDate: string;
  },
): Promise<GeneratedDoc> {
  ensureTemplatesSeeded();

  const itemsHtml = invoiceData.items
    .map((item) => `<tr><td>${item.description}</td><td>$${item.amount.toFixed(2)}</td></tr>`)
    .join("");

  const total = invoiceData.items.reduce((sum, item) => sum + item.amount, 0);

  const invoiceTemplate: Omit<DocTemplate, "id"> = {
    name: "Invoice",
    type: "invoice",
    format: "pdf",
    template: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Invoice — {clientName}</title><style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto}table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #ccc}th{background:#f0f4f8}.total{font-weight:bold}</style></head><body><h1>Invoice</h1><p><strong>Bill To:</strong> {clientName}</p><p><strong>Due Date:</strong> {dueDate}</p><table><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody>{itemsHtml}<tr class="total"><td>Total</td><td>${"{total}"}</td></tr></tbody></table></body></html>`,
    variables: ["clientName", "dueDate", "itemsHtml", "total"],
  };

  const registered = registerTemplate(invoiceTemplate);

  return generateDocument(tenantId, registered.id, {
    clientName: invoiceData.clientName,
    dueDate: invoiceData.dueDate,
    itemsHtml,
    total: total.toFixed(2),
  });
}
