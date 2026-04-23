import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getCanonicalEvents, getLeadRecords } from "@/lib/runtime-store";

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const leads = await getLeadRecords();
  const events = await getCanonicalEvents();

  const hotLeads = leads
    .filter((lead) => lead.score >= 75 || lead.hot)
    .map((lead) => {
      const leadEvents = events.filter((e) => e.leadKey === lead.leadKey);
      const latestEvent = leadEvents.length > 0
        ? leadEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
        : null;

      const reasons: string[] = [];
      if (lead.hot) reasons.push("Marked hot");
      if (lead.score >= 90) reasons.push("Score above 90");
      else if (lead.score >= 75) reasons.push("Score above 75");
      if (lead.milestones.leadMilestones.includes("lead-m3-booked-or-offered")) reasons.push("Booked or offered");
      if (lead.milestones.leadMilestones.includes("lead-m2-return-engaged")) reasons.push("Return engaged");
      if (lead.milestones.visitCount >= 3) reasons.push(`${lead.milestones.visitCount} visits`);

      return {
        leadKey: lead.leadKey,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        niche: lead.niche,
        source: lead.source,
        family: lead.family,
        stage: lead.stage,
        score: lead.score,
        reasons,
        lastActivity: latestEvent?.timestamp ?? lead.updatedAt,
        lastEventType: latestEvent?.eventType ?? null,
      };
    })
    .sort((a, b) => b.score - a.score);

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const highIntentEventTypes = [
    "lead_milestone_reached",
    "customer_milestone_reached",
    "booking_requested",
    "proposal_requested",
    "checkout_started",
    "form_submitted",
  ];

  const recentHighIntentEvents = events
    .filter((event) =>
      event.timestamp >= twentyFourHoursAgo &&
      highIntentEventTypes.includes(event.eventType),
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20)
    .map((event) => ({
      id: event.id,
      eventType: event.eventType,
      leadKey: event.leadKey,
      timestamp: event.timestamp,
      channel: event.channel,
      niche: event.niche,
      metadata: event.metadata,
    }));

  const activityFeed = events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50)
    .map((event) => ({
      id: event.id,
      eventType: event.eventType,
      leadKey: event.leadKey,
      timestamp: event.timestamp,
      channel: event.channel,
      niche: event.niche,
      source: event.source,
    }));

  return NextResponse.json({
    success: true,
    data: {
      hotLeads,
      recentHighIntentEvents,
      activityFeed,
    },
  });
}
