import { sendEmailAction, sendSmsAction, syncLeadToCrm } from "../providers";
import { optimizeConfig } from "./optimizer";
import { loadTenantAgentConfig } from "./config-loader";

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

    case 'optimizer': {
      const tenantId = event.trace?.tenant || "default";
      const config = loadTenantAgentConfig(tenantId);
      const result = optimizeConfig(config);

      return {
        agent: 'optimizer',
        result: 'optimized',
        stats: result.stats,
        nextConfig: result.nextConfig,
        changed: result.changed
      };
    }

    default:
      return { agent: agentName, result: 'noop' };
  }
}
