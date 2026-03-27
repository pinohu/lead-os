export type BlockType =
  | "hero" | "text" | "image" | "cta" | "form" | "testimonial"
  | "faq" | "pricing" | "features" | "stats" | "video" | "divider"
  | "columns" | "countdown" | "social-proof";

export interface PageBlock {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
  order: number;
}

export interface LandingPage {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  description: string;
  blocks: PageBlock[];
  seo: {
    title: string;
    description: string;
    ogImage?: string;
  };
  styles: {
    primaryColor: string;
    backgroundColor: string;
    fontFamily: string;
  };
  status: "draft" | "published" | "archived";
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormDefinition {
  id: string;
  tenantId: string;
  name: string;
  fields: FormField[];
  submitAction: "intake" | "subscribe" | "custom-webhook";
  submitUrl?: string;
  successMessage: string;
  redirectUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: "text" | "email" | "phone" | "select" | "textarea" | "checkbox" | "radio" | "number" | "date" | "file" | "hidden";
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: { pattern?: string; min?: number; max?: number; minLength?: number; maxLength?: number };
  conditionalOn?: { field: string; value: string };
  order: number;
}

const pageStore = new Map<string, LandingPage>();
const formStore = new Map<string, FormDefinition>();

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Page CRUD
// ---------------------------------------------------------------------------

export function createPage(input: Omit<LandingPage, "id" | "createdAt" | "updatedAt">): LandingPage {
  const existing = [...pageStore.values()].find(
    (p) => p.tenantId === input.tenantId && p.slug === input.slug,
  );
  if (existing) {
    throw new Error(`Page with slug "${input.slug}" already exists for tenant "${input.tenantId}"`);
  }

  const now = new Date().toISOString();
  const page: LandingPage = { ...input, id: generateId(), createdAt: now, updatedAt: now };
  pageStore.set(page.id, page);
  return page;
}

export function getPage(id: string): LandingPage | undefined {
  return pageStore.get(id);
}

export function getPageBySlug(tenantId: string, slug: string): LandingPage | undefined {
  return [...pageStore.values()].find(
    (p) => p.tenantId === tenantId && p.slug === slug,
  );
}

export function updatePage(
  id: string,
  patch: Partial<Omit<LandingPage, "id" | "createdAt">>,
): LandingPage | undefined {
  const existing = pageStore.get(id);
  if (!existing) return undefined;

  if (patch.slug && patch.slug !== existing.slug) {
    const conflict = [...pageStore.values()].find(
      (p) => p.tenantId === existing.tenantId && p.slug === patch.slug && p.id !== id,
    );
    if (conflict) {
      throw new Error(`Page with slug "${patch.slug}" already exists for tenant "${existing.tenantId}"`);
    }
  }

  const updated: LandingPage = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  pageStore.set(id, updated);
  return updated;
}

export function deletePage(id: string): boolean {
  return pageStore.delete(id);
}

export function listPages(tenantId: string, status?: LandingPage["status"]): LandingPage[] {
  let results = [...pageStore.values()].filter((p) => p.tenantId === tenantId);
  if (status) {
    results = results.filter((p) => p.status === status);
  }
  return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function publishPage(id: string): LandingPage | undefined {
  const page = pageStore.get(id);
  if (!page) return undefined;
  const updated: LandingPage = {
    ...page,
    status: "published",
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  pageStore.set(id, updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Form CRUD
// ---------------------------------------------------------------------------

export function createForm(input: Omit<FormDefinition, "id" | "createdAt" | "updatedAt">): FormDefinition {
  const now = new Date().toISOString();
  const form: FormDefinition = { ...input, id: generateId(), createdAt: now, updatedAt: now };
  formStore.set(form.id, form);
  return form;
}

export function getForm(id: string): FormDefinition | undefined {
  return formStore.get(id);
}

export function listForms(tenantId: string): FormDefinition[] {
  return [...formStore.values()]
    .filter((f) => f.tenantId === tenantId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function updateForm(
  id: string,
  patch: Partial<Omit<FormDefinition, "id" | "createdAt">>,
): FormDefinition | undefined {
  const existing = formStore.get(id);
  if (!existing) return undefined;
  const updated: FormDefinition = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  formStore.set(id, updated);
  return updated;
}

export function deleteForm(id: string): boolean {
  return formStore.delete(id);
}

// ---------------------------------------------------------------------------
// Block Renderers
// ---------------------------------------------------------------------------

export function renderBlock(block: PageBlock, styles: LandingPage["styles"]): string {
  const p = block.props;
  const primary = styles.primaryColor;

  switch (block.type) {
    case "hero": {
      const headline = escapeHtml(String(p.headline ?? ""));
      const subheadline = escapeHtml(String(p.subheadline ?? ""));
      const ctaText = escapeHtml(String(p.ctaText ?? "Get Started"));
      const ctaUrl = escapeHtml(String(p.ctaUrl ?? "#"));
      const bgImage = p.backgroundImage ? `background-image:url('${escapeHtml(String(p.backgroundImage))}');background-size:cover;background-position:center;` : "";
      const bgColor = p.backgroundColor ? `background-color:${escapeHtml(String(p.backgroundColor))};` : `background-color:${primary};`;
      return `<section style="padding:80px 24px;text-align:center;${bgColor}${bgImage}color:#ffffff;">
<div style="max-width:600px;margin:0 auto;">
<h1 style="margin:0 0 16px;font-size:40px;font-weight:800;line-height:1.2;">${headline}</h1>
${subheadline ? `<p style="margin:0 0 32px;font-size:20px;line-height:1.5;opacity:0.9;">${subheadline}</p>` : ""}
<a href="${ctaUrl}" style="display:inline-block;padding:16px 40px;background-color:#ffffff;color:${primary};font-size:18px;font-weight:700;border-radius:8px;text-decoration:none;">${ctaText}</a>
</div>
</section>`;
    }

    case "text": {
      const content = String(p.content ?? "");
      const align = p.align ? `text-align:${escapeHtml(String(p.align))};` : "";
      return `<section style="padding:40px 24px;${align}">
<div style="max-width:600px;margin:0 auto;font-size:16px;line-height:1.7;color:#374151;">${content}</div>
</section>`;
    }

    case "image": {
      const src = escapeHtml(String(p.src ?? ""));
      const alt = escapeHtml(String(p.alt ?? ""));
      const caption = p.caption ? escapeHtml(String(p.caption)) : "";
      return `<section style="padding:24px;text-align:center;">
<img src="${src}" alt="${alt}" style="max-width:100%;height:auto;border-radius:8px;" />
${caption ? `<p style="margin:12px 0 0;font-size:14px;color:#6b7280;">${caption}</p>` : ""}
</section>`;
    }

    case "cta": {
      const text = escapeHtml(String(p.text ?? "Take Action"));
      const url = escapeHtml(String(p.url ?? "#"));
      const description = p.description ? escapeHtml(String(p.description)) : "";
      return `<section style="padding:48px 24px;text-align:center;background-color:#f9fafb;">
<div style="max-width:500px;margin:0 auto;">
${description ? `<p style="margin:0 0 24px;font-size:18px;line-height:1.5;color:#374151;">${description}</p>` : ""}
<a href="${url}" style="display:inline-block;padding:16px 40px;background-color:${primary};color:#ffffff;font-size:18px;font-weight:700;border-radius:8px;text-decoration:none;">${text}</a>
</div>
</section>`;
    }

    case "form": {
      const formId = String(p.formId ?? "");
      const actionUrl = escapeHtml(String(p.actionUrl ?? "#"));
      return `<section style="padding:48px 24px;background-color:#f9fafb;">
<div style="max-width:500px;margin:0 auto;" data-form-id="${escapeHtml(formId)}" data-action-url="${actionUrl}">
<p style="text-align:center;color:#6b7280;">Form: ${escapeHtml(formId)}</p>
</div>
</section>`;
    }

    case "testimonial": {
      const quote = escapeHtml(String(p.quote ?? ""));
      const name = escapeHtml(String(p.name ?? ""));
      const role = escapeHtml(String(p.role ?? ""));
      const avatar = p.avatar ? escapeHtml(String(p.avatar)) : "";
      return `<section style="padding:48px 24px;background-color:#f9fafb;">
<div style="max-width:500px;margin:0 auto;text-align:center;">
${avatar ? `<img src="${avatar}" alt="${name}" style="width:64px;height:64px;border-radius:50%;margin:0 auto 16px;" />` : ""}
<blockquote style="margin:0 0 16px;font-size:18px;line-height:1.6;color:#374151;font-style:italic;">"${quote}"</blockquote>
<p style="margin:0;font-size:16px;font-weight:600;color:#111827;">${name}</p>
${role ? `<p style="margin:4px 0 0;font-size:14px;color:#6b7280;">${role}</p>` : ""}
</div>
</section>`;
    }

    case "faq": {
      const items = Array.isArray(p.items) ? (p.items as Array<{ question: string; answer: string }>) : [];
      const title = p.title ? escapeHtml(String(p.title)) : "Frequently Asked Questions";
      const faqHtml = items
        .map(
          (item) => `<div style="margin:0 0 16px;padding:20px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
<h3 style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">${escapeHtml(String(item.question))}</h3>
<p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">${escapeHtml(String(item.answer))}</p>
</div>`,
        )
        .join("\n");
      return `<section style="padding:48px 24px;background-color:#f9fafb;">
<div style="max-width:600px;margin:0 auto;">
<h2 style="margin:0 0 24px;font-size:28px;font-weight:700;color:#111827;text-align:center;">${title}</h2>
${faqHtml}
</div>
</section>`;
    }

    case "pricing": {
      const plans = Array.isArray(p.plans) ? (p.plans as Array<{ name: string; price: string; features: string[]; ctaText: string; ctaUrl: string; highlighted?: boolean }>) : [];
      const title = p.title ? escapeHtml(String(p.title)) : "Pricing";
      const planCards = plans
        .map((plan) => {
          const border = plan.highlighted ? `border:2px solid ${primary};` : "border:1px solid #e5e7eb;";
          const badge = plan.highlighted ? `<div style="background-color:${primary};color:#fff;text-align:center;padding:4px;font-size:12px;font-weight:600;border-radius:8px 8px 0 0;">Most Popular</div>` : "";
          const features = plan.features
            .map((f) => `<li style="padding:4px 0;font-size:14px;color:#374151;">${escapeHtml(String(f))}</li>`)
            .join("");
          return `<div style="flex:1;min-width:200px;max-width:300px;${border}border-radius:8px;overflow:hidden;background-color:#ffffff;">
${badge}
<div style="padding:24px;">
<h3 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">${escapeHtml(String(plan.name))}</h3>
<p style="margin:0 0 16px;font-size:32px;font-weight:800;color:${primary};">${escapeHtml(String(plan.price))}</p>
<ul style="margin:0 0 24px;padding-left:16px;list-style:none;">${features}</ul>
<a href="${escapeHtml(String(plan.ctaUrl))}" style="display:block;text-align:center;padding:12px;background-color:${primary};color:#fff;font-weight:600;border-radius:6px;text-decoration:none;">${escapeHtml(String(plan.ctaText))}</a>
</div>
</div>`;
        })
        .join("");
      return `<section style="padding:48px 24px;">
<h2 style="margin:0 0 32px;font-size:28px;font-weight:700;color:#111827;text-align:center;">${title}</h2>
<div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;max-width:960px;margin:0 auto;">${planCards}</div>
</section>`;
    }

    case "features": {
      const items = Array.isArray(p.items) ? (p.items as Array<{ title: string; description: string; icon?: string }>) : [];
      const title = p.title ? escapeHtml(String(p.title)) : "Features";
      const featureCards = items
        .map(
          (item) => `<div style="flex:1;min-width:180px;max-width:280px;padding:24px;text-align:center;">
${item.icon ? `<div style="font-size:32px;margin-bottom:12px;">${escapeHtml(String(item.icon))}</div>` : ""}
<h3 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#111827;">${escapeHtml(String(item.title))}</h3>
<p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">${escapeHtml(String(item.description))}</p>
</div>`,
        )
        .join("");
      return `<section style="padding:48px 24px;">
<h2 style="margin:0 0 32px;font-size:28px;font-weight:700;color:#111827;text-align:center;">${title}</h2>
<div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;max-width:960px;margin:0 auto;">${featureCards}</div>
</section>`;
    }

    case "stats": {
      const items = Array.isArray(p.items) ? (p.items as Array<{ value: string; label: string }>) : [];
      const statCards = items
        .map(
          (item) => `<div style="flex:1;min-width:120px;text-align:center;padding:16px;">
<p style="margin:0 0 4px;font-size:36px;font-weight:800;color:${primary};">${escapeHtml(String(item.value))}</p>
<p style="margin:0;font-size:14px;color:#6b7280;">${escapeHtml(String(item.label))}</p>
</div>`,
        )
        .join("");
      return `<section style="padding:48px 24px;background-color:#f9fafb;">
<div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;max-width:800px;margin:0 auto;">${statCards}</div>
</section>`;
    }

    case "video": {
      const src = escapeHtml(String(p.src ?? ""));
      const title = p.title ? escapeHtml(String(p.title)) : "";
      return `<section style="padding:48px 24px;text-align:center;">
<div style="max-width:600px;margin:0 auto;">
${title ? `<h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">${title}</h2>` : ""}
<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;">
<iframe src="${src}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen title="${title || "Video"}"></iframe>
</div>
</div>
</section>`;
    }

    case "divider": {
      const color = p.color ? escapeHtml(String(p.color)) : "#e5e7eb";
      return `<section style="padding:24px;">
<hr style="border:none;border-top:1px solid ${color};margin:0;" />
</section>`;
    }

    case "columns": {
      const cols = Array.isArray(p.columns) ? (p.columns as Array<{ content: string }>) : [];
      const colHtml = cols
        .map(
          (col) => `<div style="flex:1;min-width:200px;padding:16px;">${String(col.content)}</div>`,
        )
        .join("");
      return `<section style="padding:48px 24px;">
<div style="display:flex;gap:16px;flex-wrap:wrap;max-width:960px;margin:0 auto;">${colHtml}</div>
</section>`;
    }

    case "countdown": {
      const targetDate = escapeHtml(String(p.targetDate ?? ""));
      const headline = p.headline ? escapeHtml(String(p.headline)) : "Limited Time Offer";
      return `<section style="padding:48px 24px;text-align:center;background-color:${primary};color:#ffffff;">
<h2 style="margin:0 0 16px;font-size:28px;font-weight:700;">${headline}</h2>
<div data-countdown="${targetDate}" style="font-size:36px;font-weight:800;letter-spacing:4px;">
<span>00</span>:<span>00</span>:<span>00</span>:<span>00</span>
</div>
<p style="margin:12px 0 0;font-size:14px;opacity:0.8;">Days : Hours : Minutes : Seconds</p>
</section>`;
    }

    case "social-proof": {
      const logos = Array.isArray(p.logos) ? (p.logos as Array<{ src: string; alt: string }>) : [];
      const title = p.title ? escapeHtml(String(p.title)) : "Trusted by leading companies";
      const logoHtml = logos
        .map(
          (logo) => `<img src="${escapeHtml(String(logo.src))}" alt="${escapeHtml(String(logo.alt))}" style="height:32px;opacity:0.6;margin:8px 16px;" />`,
        )
        .join("");
      return `<section style="padding:48px 24px;text-align:center;">
<p style="margin:0 0 24px;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:2px;">${title}</p>
<div style="display:flex;justify-content:center;align-items:center;flex-wrap:wrap;">${logoHtml}</div>
</section>`;
    }

    default:
      return `<section style="padding:24px;"><p style="color:#6b7280;">Unknown block type: ${escapeHtml(block.type)}</p></section>`;
  }
}

// ---------------------------------------------------------------------------
// Form Renderer
// ---------------------------------------------------------------------------

export function renderFormToHtml(form: FormDefinition, actionUrl: string): string {
  const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);

  const fieldHtml = sortedFields
    .map((field) => {
      const conditionalAttrs = field.conditionalOn
        ? ` data-conditional-field="${escapeHtml(field.conditionalOn.field)}" data-conditional-value="${escapeHtml(field.conditionalOn.value)}" style="display:none;margin:0 0 16px;"`
        : ` style="margin:0 0 16px;"`;
      const requiredAttr = field.required ? " required" : "";
      const placeholderAttr = field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : "";
      const inputStyle = 'style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;box-sizing:border-box;"';

      let validationAttrs = "";
      if (field.validation) {
        if (field.validation.pattern) validationAttrs += ` pattern="${escapeHtml(field.validation.pattern)}"`;
        if (field.validation.min !== undefined) validationAttrs += ` min="${field.validation.min}"`;
        if (field.validation.max !== undefined) validationAttrs += ` max="${field.validation.max}"`;
        if (field.validation.minLength !== undefined) validationAttrs += ` minlength="${field.validation.minLength}"`;
        if (field.validation.maxLength !== undefined) validationAttrs += ` maxlength="${field.validation.maxLength}"`;
      }

      let inputHtml: string;

      switch (field.type) {
        case "textarea":
          inputHtml = `<textarea id="${escapeHtml(field.id)}" name="${escapeHtml(field.name)}" ${inputStyle}${requiredAttr}${placeholderAttr}${validationAttrs} rows="4"></textarea>`;
          break;
        case "select":
          inputHtml = `<select id="${escapeHtml(field.id)}" name="${escapeHtml(field.name)}" ${inputStyle}${requiredAttr}>
<option value="">Select...</option>
${(field.options ?? []).map((opt) => `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`).join("\n")}
</select>`;
          break;
        case "checkbox":
          inputHtml = `<label style="display:flex;align-items:center;gap:8px;font-size:14px;color:#374151;">
<input type="checkbox" id="${escapeHtml(field.id)}" name="${escapeHtml(field.name)}" value="true"${requiredAttr} style="width:16px;height:16px;" />
${escapeHtml(field.label)}
</label>`;
          break;
        case "radio":
          inputHtml = (field.options ?? [])
            .map(
              (opt) => `<label style="display:flex;align-items:center;gap:8px;font-size:14px;color:#374151;margin:4px 0;">
<input type="radio" name="${escapeHtml(field.name)}" value="${escapeHtml(opt.value)}"${requiredAttr} style="width:16px;height:16px;" />
${escapeHtml(opt.label)}
</label>`,
            )
            .join("\n");
          break;
        case "hidden":
          return `<input type="hidden" name="${escapeHtml(field.name)}" value="${escapeHtml(String(field.placeholder ?? ""))}" />`;
        default:
          inputHtml = `<input type="${escapeHtml(field.type)}" id="${escapeHtml(field.id)}" name="${escapeHtml(field.name)}" ${inputStyle}${requiredAttr}${placeholderAttr}${validationAttrs} />`;
          break;
      }

      const labelHtml = field.type === "checkbox"
        ? ""
        : `<label for="${escapeHtml(field.id)}" style="display:block;margin-bottom:4px;font-size:14px;font-weight:500;color:#111827;">${escapeHtml(field.label)}${field.required ? '<span style="color:#ef4444;"> *</span>' : ""}</label>`;

      return `<div${conditionalAttrs}>
${labelHtml}
${inputHtml}
</div>`;
    })
    .join("\n");

  return `<form action="${escapeHtml(actionUrl)}" method="POST" style="max-width:500px;margin:0 auto;padding:24px;">
<h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">${escapeHtml(form.name)}</h2>
${fieldHtml}
<button type="submit" style="width:100%;padding:14px;background-color:#14b8a6;color:#ffffff;font-size:16px;font-weight:600;border:none;border-radius:6px;cursor:pointer;margin-top:8px;">Submit</button>
</form>`;
}

// ---------------------------------------------------------------------------
// Full Page Renderer
// ---------------------------------------------------------------------------

export function renderPageToHtml(page: LandingPage): string {
  const blocksHtml = [...page.blocks]
    .sort((a, b) => a.order - b.order)
    .map((block) => renderBlock(block, page.styles))
    .join("\n");

  const seoTitle = escapeHtml(page.seo.title || page.title);
  const seoDesc = escapeHtml(page.seo.description || page.description);
  const ogImage = page.seo.ogImage ? `<meta property="og:image" content="${escapeHtml(page.seo.ogImage)}" />` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${seoTitle}</title>
<meta name="description" content="${seoDesc}" />
<meta property="og:title" content="${seoTitle}" />
<meta property="og:description" content="${seoDesc}" />
${ogImage}
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:${escapeHtml(page.styles.fontFamily)},system-ui,-apple-system,sans-serif;background-color:${escapeHtml(page.styles.backgroundColor)};color:#111827;-webkit-font-smoothing:antialiased;}
img{max-width:100%;height:auto;}
a{color:${escapeHtml(page.styles.primaryColor)};}
@media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms !important;transition-duration:0.01ms !important;}}
</style>
</head>
<body>
<main>
${blocksHtml}
</main>
</body>
</html>`;
}

export function _getPageStoreForTesting(): Map<string, LandingPage> {
  return pageStore;
}

export function _getFormStoreForTesting(): Map<string, FormDefinition> {
  return formStore;
}
