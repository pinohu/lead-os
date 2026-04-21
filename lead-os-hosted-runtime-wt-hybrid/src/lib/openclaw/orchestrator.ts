export async function orchestrate(event) {
  const actions = [];

  if (event.eventType === 'lead.captured') {
    actions.push('qualifier');
  }

  if (event.metadata && event.metadata.score > 70) {
    actions.push('closer');
  }

  return actions;
}
