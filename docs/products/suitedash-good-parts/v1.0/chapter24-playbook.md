
## 24. A 90-Minute Playbook: Configuring SuiteDash for a 5-Client Service Business

The previous twenty-three chapters describe what SuiteDash can do. This chapter describes what to actually do — in the order to do it — when you have a Pinnacle license, five clients, and ninety minutes before your next meeting.

The premise of the playbook is brutal: ignore every feature you don't need this week. The biggest mistake new operators make is trying to configure all of SuiteDash before onboarding the first client. The opposite approach gets you live faster, exposes the configuration choices that matter, and forces you to learn the platform on real work instead of in the abstract.

### What you'll have when you finish

A working portal where five clients can each log in, see their files, submit support tickets, view their proposal or invoice, and message you. No marketing automation. No drip campaigns. No FLOWs. No custom dashboards beyond the defaults. Those come later.

### Minute 0–10: White label, then stop

Open *Settings → White Label*. Set the platform name, upload your logo (square SVG or 512×512 PNG), and pick brand colors. Set the login URL to a subdomain you actually own — `portal.yourbrand.com`, not `yourbrand.suitedash.com`. The branded login URL alone is what makes the portal feel like yours rather than a SuiteDash deployment.

Do not configure the email white-labeling yet. SPF/DKIM/DMARC for the sending domain is a 30-minute rabbit hole and you don't need it for the first five clients. Default sender works.

Skip the custom domain for client-facing emails. Skip the favicon. Skip the legal pages. Come back to all of these after the first client is onboarded.

### Minute 10–25: One client circle, one role customization

Create one Circle in CRM — call it `clients-active`. This is your one operational segment for now. Don't pre-create `prospects`, `churned`, `enterprise`, etc. The Circle exists so automations have something to filter on.

Then open *Custom Menus → Client role*. Hide every menu item that isn't `Files`, `Documents`, `Support`, `Messages`, and `Invoices`. The default client menu shows ten items and most clients are confused by `Pages`, `Calendar`, and `LMS` on day one. Two minutes of hiding saves twenty minutes of "what is this?" emails per client.

Save. Move on. Resist the urge to add custom direct-link menu items.

### Minute 25–40: A single dashboard widget set

Open *Pages → Dashboards → Client default dashboard*. Delete every widget except: (1) a welcome message Content Block addressing the client by their first-name dynamic placeholder, (2) the Recent Files widget, (3) the Open Tickets widget. That's the dashboard.

If you want one more thing, add a Content Block with a static block of three links: "Submit a new request", "Upload a file", "View invoices". Hard-link them to the respective pages. Five-client dashboards don't need analytics widgets; the operator (you) is the one watching numbers from the admin side.

### Minute 40–55: Three forms, no more

Create three Forms:

The first is a **new-client intake form** — name, email, phone, company name, project type (single-select), preferred contact method (single-select). Set its automation to: on submit, create a Contact in CRM, assign to the `clients-active` Circle, send a welcome email (template you'll write in the next step), and create a Project from a template (template you'll write after that).

The second is a **support request form** living on a dedicated portal page. Subject, description, attach files, urgency (low/medium/high). On submit, create a Support Ticket and assign to you.

The third is a **file-request form** — used when you need a document from a client. This one is internal-facing; you trigger it from the contact record. Optional for week one. If you skip it, manual uploads via the Files menu work fine.

### Minute 55–70: Two automations only

The temptation here is to wire eight automations. Resist it.

The first automation: **on new contact assigned to clients-active Circle**, send the welcome email (one templated email with portal login instructions and an embedded link to set their password), wait three days, then send a follow-up email asking how onboarding is going. That's it. Two-step sequence.

The second automation: **on Project status changed to Complete**, send the client a templated "Project wrapped" email with a link to leave a testimonial and another link to start the next engagement. This one captures the highest-leverage moment in your operational flow.

That's two automations. You'll add more after you see what your actual clients actually do.

### Minute 70–80: One Project template

Open *Project Generators → New template*. Build the smallest version of your standard engagement: three phases, four tasks per phase, with the assignee set to you and the due-date offset set in days from project start. Don't use dependencies yet. Don't enable Kanban view in the template — let it default. Don't add custom fields.

The point of the template is that the new-client form's automation has something to generate from. The template will improve every month as you do real projects; v1 just needs to exist.

### Minute 80–90: A single document template and a single invoice

Generate one Document Generator template for your most common deliverable (a kickoff doc, a recap, a status report — pick the one you most often send manually). Use three dynamic placeholders: client first name, project name, current date. Set the signer to the client if it needs a signature; leave it as a non-signed document if not.

Then go to *Office → Invoice Templates* and build the simplest version of your standard invoice. One line item, your standard rate or package price, your payment terms, your bank details or the Stripe-connect "pay invoice" button. That's the invoice template.

### Why this works

Nine of the twenty-three chapters in this guide describe features you don't need on day one. Five clients don't justify FLOWs, custom WORLDs, complex automation chains, marketing campaigns, the LMS, or detailed permission matrices. They justify three forms, two automations, one project template, one document template, one invoice template, one client circle, one customized menu, and one cleaned-up dashboard.

When you onboard the sixth client and notice the same email going out three times manually, that's the signal to add the third automation. When you notice four clients asking the same question, that's the signal to add a portal page or a knowledge base article. The platform's capacity grows alongside your operational pressure, not ahead of it.

The configuration choices that matter become obvious through use. The ones that don't matter never come up. SuiteDash is large enough to absorb every operational pattern a small services firm will throw at it; the only mistake is trying to configure for patterns you don't have yet.

### Three things to do at month two

Once you've run the playbook above and have five clients living in the portal, the next three highest-leverage additions in order are:

First, set up email white-labeling properly. SPF + DKIM + DMARC for the sending domain plus a custom MAIL FROM address. This is where the platform feels truly white-labeled. Allow yourself the 30–60 minutes here that you skipped on day one.

Second, build one drip campaign for prospects who haven't converted within 14 days. Three emails over two weeks, each addressing a different objection. Hook it to a separate Circle (`prospects-stalled`) and a manual tag from a CRM follow-up.

Third, set up one knowledge base portal page with the five questions every client has asked you in the first month. Link it from the support form. The volume of repeat support tickets drops sharply once the knowledge base exists.

After those three additions you're using maybe 25% of what SuiteDash can do. That's the correct level for the first 30–50 clients. Going beyond that is what the rest of this document is for.

---
