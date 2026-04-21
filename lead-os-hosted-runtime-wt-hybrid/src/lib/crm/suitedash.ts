export async function pushToSuiteDash(input) {
  const endpoint = process.env.SUITEDASH_WEBHOOK_URL;

  if (!endpoint) {
    return { delivered: false, reason: "no_endpoint" };
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return {
    delivered: res.ok,
    status: res.status,
  };
}
