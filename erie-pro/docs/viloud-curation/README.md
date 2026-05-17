# Viloud TV Channel Curation — erie.pro

This directory contains per-niche curation guides for the Viloud TV channels that embed on erie.pro niche pages (e.g. `/plumbing`, `/hvac`).

## How this works

1. **Channels live in Viloud.** Each niche gets its own 24/7 linear channel pulling from a scheduled mix of YouTube video links.
2. **Embed is automatic.** Once you populate `src/lib/viloud-channels.ts` with the Viloud channel ID for a niche, the embed renders on that niche's page. Until then it's invisible — no broken state.
3. **Curation is the bottleneck.** Each channel needs ~20-30 vetted videos to look "always-on" rather than a thin loop. This directory tells you which YouTube channels to source from, what programming structure to follow, and what vetting criteria to apply.

## Priority order (do these 5 first)

1. **plumbing** — `plumbing.md`
2. **hvac** — `hvac.md`
3. **electrical** — `electrical.md`
4. **roofing** — `roofing.md`
5. **restoration** — `restoration.md`

These match the priority niches already hand-tuned in the educational content generator (`src/lib/niche/educational-content.ts` on PR #46/#47). Same audiences, same content gravitational pull — curating them first means a Viloud channel always pairs with the best educational content.

## Workflow per niche

For each niche file:

1. **Read the channel recommendations.** Vetted YouTube channels with credibility notes.
2. **Open each in YouTube → Videos tab → sort by Most Popular.** Skim for educational content that fits the programming blocks below.
3. **Apply vetting criteria** (see "Vetting criteria" below) and skip anything that fails.
4. **Collect 20-30 YouTube video URLs** spread across the recommended programming blocks.
5. **In Viloud:** Create channel → Add videos from URLs → Schedule into time blocks → Save embed code → Copy the 32-char channel ID.
6. **Update `src/lib/viloud-channels.ts`:** Replace `null` with the channel ID string for that niche slug.
7. **Push to deploy.** Embed goes live automatically.

## Programming structure (template — applies to most niches)

A 24-hour channel with rotating educational content. The same 6 blocks repeat 4× through the day so any visitor sees varied content within a typical browsing session.

| Block | Theme | Why | Typical length |
|---|---|---|---|
| 1. Foundations | What this service category is, basic vocabulary | First-time visitors orient themselves | 3-8 min per video |
| 2. DIY vs. Pro | What you can handle yourself vs. what needs a pro | Filters out wrong-fit traffic; primes hire intent | 5-12 min |
| 3. Red flags & warning signs | Visible signs that suggest you need to act | Direct lead-gen content | 5-10 min |
| 4. What a pro visit looks like | Demystifies the appointment | Reduces "fear of cost" friction | 8-15 min |
| 5. Cost & pricing context | What's reasonable, how prices vary | Sets expectations; converts watchers to lead-form fills | 5-10 min |
| 6. Maintenance & long-term care | What to do between appointments | Establishes expertise & ongoing-relationship framing | 5-12 min |

Each block is 4-5 videos. 24 videos × ~8 min average = ~3 hours of unique content, looping 8× per day.

## Vetting criteria — skip videos that fail any of these

| Criterion | Threshold | Why |
|---|---|---|
| Embeddable | YouTube embed not disabled | Hard requirement — Viloud won't pull it |
| Channel age | >1 year, >10 videos | Filters out spam / cash-grab channels |
| Subscribers | >5,000 | Filters out hobbyist / unreliable creators |
| Most-viewed video views | >50,000 | Signal of quality and trust |
| Production quality | Audio + video both watchable on a 10-second sample | TV channel embed needs broadcast-feel |
| Educational, not sponsorship-heavy | Sponsor segment <30 seconds, content stands alone | Don't embed someone else's ad |
| Niche-specific, not pure entertainment | Teaches something useful | Filter signals to "expertise content" |
| Family-safe | No profanity, no graphic content | Embedded on a directory; needs to look professional |
| Not competitor-promoting | Doesn't push viewers to a competing directory or lead service | Self-evident |
| Recent enough to look fresh | Top videos uploaded within last 5 years | Older content can feel dated; mix in 1-2 evergreen classics |

## Legal / embedding notes

Viloud pulls YouTube videos via the standard YouTube embed API. YouTube's terms allow embedding of videos where the uploader has not disabled embedding (the default). You are not redistributing the video — you're embedding it the same way millions of websites do.

What this means in practice:
- You're not infringing copyright by including a YouTube video in a Viloud channel that points to that video's URL
- The video creator retains all monetization rights (pre-roll ads still appear on their videos)
- If a creator deletes their video, your channel skips it
- If a creator disables embedding after the fact, Viloud will show an error for that slot until you remove it

For pre-roll-heavy channels, you may want to layer in your own Gumlet-hosted intros/outros as channel branding (separate from the curated YouTube content). That's optional.

## Tracking channel performance

After channels go live, measurement happens via Vercel Analytics on the niche pages. Compare against baseline (pre-channel deploy):

- **Dwell time per niche page** (the headline metric — does the embed make people stay longer?)
- **Bounce rate per niche page** (do they leave faster or slower?)
- **Scroll depth** (does the embed pull them deeper into the page?)
- **Lead form conversion rate** (the only metric that matters at the bottom of the funnel)

Run for 30 days minimum before drawing conclusions. A/B testing channels on/off is overkill for the initial validation; raw before/after on the same niche page is sufficient signal.

## Scaling beyond priority 5

After the priority 5 launch and 30-day measurement:

- **If signal is positive** → expand to the next 11 hand-tuned cluster niches (the ones with full educational content in the cluster work)
- **If signal is positive at scale** → roll out to all 112 niches, batching by cluster
- **If signal is flat or negative** → keep priority 5 live (cheap to maintain), don't expand
- **If signal is strongly positive in specific niches** → double down: longer programming, original content, branded intros
