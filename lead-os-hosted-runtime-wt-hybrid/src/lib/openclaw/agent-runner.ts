export async function runAgent(agentName, event) {
  switch (agentName) {
    case 'qualifier':
      return { agent: 'qualifier', result: 'scored' };
    case 'closer':
      return { agent: 'closer', result: 'conversion-triggered' };
    default:
      return { agent: agentName, result: 'noop' };
  }
}
