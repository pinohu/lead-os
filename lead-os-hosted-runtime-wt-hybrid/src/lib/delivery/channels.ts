export async function sendEmailLead(input) {
  const webhook = process.env.LEAD_OS_EMAIL_WEBHOOK_URL;
  if (!webhook) {
    return { channel: "email", delivered: false, reason: "no_webhook" };
  }

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return { channel: "email", delivered: res.ok, status: res.status };
}

export async function sendSmsLead(input) {
  const webhook = process.env.LEAD_OS_SMS_WEBHOOK_URL;
  if (!webhook) {
    return { channel: "sms", delivered: false, reason: "no_webhook" };
  }

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return { channel: "sms", delivered: res.ok, status: res.status };
}
