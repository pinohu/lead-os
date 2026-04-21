import { sendEmailAction, sendSmsAction, syncLeadToCrm } from "../providers";

export async function runAgent(agentName, event) {
  switch (agentName) {

    case 'qualifier':
      return {
        agent: 'qualifier',
        result: 'qualified',
        score: event.metadata?.score
      };

    case 'closer': {
      const results = [];

      if (event.metadata?.email) {
        const emailRes = await sendEmailAction({
          to: event.metadata.email,
          subject: "You're a strong fit",
          html: `<p>We can help you move forward immediately.</p>`,
          trace: event.trace
        });
        results.push(emailRes);
      }

      if (event.metadata?.phone) {
        const smsRes = await sendSmsAction({
          phone: event.metadata.phone,
          body: "We can help you right now. Reply to get started."
        });
        results.push(smsRes);
      }

      const crmRes = await syncLeadToCrm({
        leadKey: event.leadKey,
        email: event.metadata?.email,
        phone: event.metadata?.phone,
        score: event.metadata?.score,
        stage: event.metadata?.stage,
        dryRun: false
      });

      results.push(crmRes);

      return {
        agent: 'closer',
        result: 'actions-executed',
        details: results
      };
    }

    default:
      return { agent: agentName, result: 'noop' };
  }
}
