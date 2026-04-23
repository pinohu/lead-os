import { randomUUID } from "crypto";
import { getTenant } from "./tenant-store.ts";
import { computeAnalyticsSnapshot } from "./data-pipeline.ts";
import type { AnalyticsSnapshot } from "./data-pipeline.ts";
import type { TenantRecord } from "./tenant-store.ts";

export type VideoType =
  | "product-demo"
  | "data-report"
  | "launch-video"
  | "testimonial"
  | "feature-highlight"
  | "weekly-recap";

export interface VideoSpec {
  type: VideoType;
  tenantId: string;
  title: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  brand: {
    name: string;
    primaryColor: string;
    accentColor: string;
    logoUrl?: string;
  };
  scenes: VideoScene[];
}

export interface VideoScene {
  id: string;
  type: "title" | "feature" | "stat" | "testimonial" | "cta" | "transition" | "data-chart";
  duration: number;
  props: Record<string, unknown>;
}

export interface GeneratedVideo {
  spec: VideoSpec;
  remotionCode: string;
  compositionId: string;
  estimatedRenderTime: number;
}

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;
const DEFAULT_FPS = 30;

function buildBrand(tenant: TenantRecord): VideoSpec["brand"] {
  return {
    name: tenant.brandName,
    primaryColor: tenant.accent || "#14b8a6",
    accentColor: "#6366f1",
  };
}

function secondsToFrames(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}

function buildTitleScene(title: string, subtitle: string): VideoScene {
  return {
    id: randomUUID(),
    type: "title",
    duration: 3,
    props: { title, subtitle },
  };
}

function buildFeatureScene(title: string, description: string, icon: string): VideoScene {
  return {
    id: randomUUID(),
    type: "feature",
    duration: 4,
    props: { title, description, icon },
  };
}

function buildStatScene(label: string, value: number, change: number, suffix: string): VideoScene {
  return {
    id: randomUUID(),
    type: "stat",
    duration: 3,
    props: { label, value, change, suffix },
  };
}

function buildTestimonialScene(name: string, quote: string): VideoScene {
  return {
    id: randomUUID(),
    type: "testimonial",
    duration: 5,
    props: { name, quote },
  };
}

function buildCtaScene(text: string, url: string): VideoScene {
  return {
    id: randomUUID(),
    type: "cta",
    duration: 3,
    props: { text, url },
  };
}

function buildTransitionScene(): VideoScene {
  return {
    id: randomUUID(),
    type: "transition",
    duration: 1,
    props: {},
  };
}

function buildDataChartScene(label: string, data: Record<string, number>): VideoScene {
  return {
    id: randomUUID(),
    type: "data-chart",
    duration: 5,
    props: { label, data },
  };
}

function generateSceneComponent(scene: VideoScene, brand: VideoSpec["brand"], fps: number): string {
  const frames = secondsToFrames(scene.duration, fps);

  switch (scene.type) {
    case "title": {
      const { title, subtitle } = scene.props as { title: string; subtitle: string };
      return `const TitleScene_${scene.id.replace(/-/g, "")} = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 20], [40, 0], { extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" });
  const gradientAngle = interpolate(frame, [0, ${frames}], [0, 360]);

  return (
    <AbsoluteFill style={{
      background: \`linear-gradient(\${gradientAngle}deg, ${brand.primaryColor}22, ${brand.accentColor}22, ${brand.primaryColor}22)\`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        opacity: titleOpacity,
        transform: \`translateY(\${titleY}px)\`,
        fontSize: 72,
        fontWeight: 700,
        color: "#fff",
        fontFamily: "Inter, system-ui, sans-serif",
        textAlign: "center",
        maxWidth: "80%",
      }}>
        ${JSON.stringify(title)}
      </div>
      <div style={{
        opacity: subtitleOpacity,
        fontSize: 28,
        color: "${brand.primaryColor}",
        fontFamily: "Inter, system-ui, sans-serif",
        marginTop: 16,
        textAlign: "center",
        maxWidth: "70%",
      }}>
        ${JSON.stringify(subtitle)}
      </div>
    </AbsoluteFill>
  );
};`;
    }

    case "feature": {
      const { title, description, icon } = scene.props as { title: string; description: string; icon: string };
      return `const FeatureScene_${scene.id.replace(/-/g, "")} = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideIn = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const iconX = interpolate(slideIn, [0, 1], [-200, 0]);
  const textX = interpolate(slideIn, [0, 1], [200, 0]);
  const descOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      background: "#0a0f1a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 80,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 60, maxWidth: "90%" }}>
        <div style={{
          transform: \`translateX(\${iconX}px)\`,
          fontSize: 120,
          minWidth: 140,
          textAlign: "center",
        }}>
          ${JSON.stringify(icon)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            transform: \`translateX(\${textX}px)\`,
            fontSize: 48,
            fontWeight: 700,
            color: "#fff",
            fontFamily: "Inter, system-ui, sans-serif",
            marginBottom: 16,
          }}>
            ${JSON.stringify(title)}
          </div>
          <div style={{
            opacity: descOpacity,
            fontSize: 24,
            color: "#9ca3af",
            fontFamily: "Inter, system-ui, sans-serif",
            lineHeight: 1.5,
          }}>
            ${JSON.stringify(description)}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};`;
    }

    case "stat": {
      const { label, value, change, suffix } = scene.props as { label: string; value: number; change: number; suffix: string };
      const changeColor = change >= 0 ? "#22c55e" : "#ef4444";
      const changePrefix = change >= 0 ? "+" : "";
      return `const StatScene_${scene.id.replace(/-/g, "")} = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: { damping: 20, stiffness: 80 } });
  const currentValue = Math.round(interpolate(progress, [0, 1], [0, ${value}]));
  const labelOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const changeOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(progress, [0, 1], [0.8, 1]);

  return (
    <AbsoluteFill style={{
      background: "#0a0f1a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{ opacity: labelOpacity, fontSize: 28, color: "#9ca3af", fontFamily: "Inter, system-ui, sans-serif", marginBottom: 16 }}>
        ${JSON.stringify(label)}
      </div>
      <div style={{
        transform: \`scale(\${scale})\`,
        fontSize: 120,
        fontWeight: 700,
        color: "${brand.primaryColor}",
        fontFamily: "Inter, system-ui, sans-serif",
      }}>
        {currentValue}${suffix ? JSON.stringify(suffix) : ""}
      </div>
      <div style={{
        opacity: changeOpacity,
        fontSize: 24,
        fontWeight: 600,
        color: "${changeColor}",
        fontFamily: "Inter, system-ui, sans-serif",
        marginTop: 12,
      }}>
        ${JSON.stringify(`${changePrefix}${change}%`)} vs last period
      </div>
    </AbsoluteFill>
  );
};`;
    }

    case "testimonial": {
      const { name, quote } = scene.props as { name: string; quote: string };
      return `const TestimonialScene_${scene.id.replace(/-/g, "")} = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideUp = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const quoteY = interpolate(slideUp, [0, 1], [60, 0]);
  const quoteOpacity = interpolate(slideUp, [0, 1], [0, 1]);
  const nameOpacity = interpolate(frame, [25, 40], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      background: "#0a0f1a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 100,
    }}>
      <div style={{
        fontSize: 80,
        color: "${brand.primaryColor}",
        marginBottom: 24,
        opacity: quoteOpacity,
      }}>
        \\u201C
      </div>
      <div style={{
        opacity: quoteOpacity,
        transform: \`translateY(\${quoteY}px)\`,
        fontSize: 32,
        color: "#f9fafb",
        fontFamily: "Inter, system-ui, sans-serif",
        textAlign: "center",
        lineHeight: 1.6,
        maxWidth: "80%",
        fontStyle: "italic",
      }}>
        ${JSON.stringify(quote)}
      </div>
      <div style={{
        opacity: nameOpacity,
        fontSize: 22,
        color: "#9ca3af",
        fontFamily: "Inter, system-ui, sans-serif",
        marginTop: 32,
      }}>
        \\u2014 ${JSON.stringify(name)}
      </div>
    </AbsoluteFill>
  );
};`;
    }

    case "cta": {
      const { text, url } = scene.props as { text: string; url: string };
      return `const CTAScene_${scene.id.replace(/-/g, "")} = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = Math.sin(frame / 8) * 4;
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const scaleIn = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
  const buttonScale = interpolate(scaleIn, [0, 1], [0.6, 1]);

  return (
    <AbsoluteFill style={{
      background: \`radial-gradient(ellipse at center, ${brand.primaryColor}33, #0a0f1a)\`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        opacity: fadeIn,
        transform: \`scale(\${buttonScale})\`,
        background: "${brand.primaryColor}",
        color: "#fff",
        fontSize: 36,
        fontWeight: 700,
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "24px 64px",
        borderRadius: 16,
        boxShadow: \`0 0 \${20 + pulse}px ${brand.primaryColor}66\`,
      }}>
        ${JSON.stringify(text)}
      </div>
      <div style={{
        opacity: fadeIn,
        fontSize: 20,
        color: "#9ca3af",
        fontFamily: "Inter, system-ui, sans-serif",
        marginTop: 24,
      }}>
        ${JSON.stringify(url)}
      </div>
    </AbsoluteFill>
  );
};`;
    }

    case "transition": {
      return `const TransitionScene_${scene.id.replace(/-/g, "")} = () => {
  const frame = useCurrentFrame();
  const wipeProgress = interpolate(frame, [0, ${frames}], [0, 100], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#0a0f1a" }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: \`\${wipeProgress}%\`,
        height: "100%",
        background: \`linear-gradient(90deg, ${brand.primaryColor}, ${brand.accentColor})\`,
        opacity: interpolate(frame, [0, ${Math.floor(frames / 2)}, ${frames}], [0, 0.6, 0], { extrapolateRight: "clamp" }),
      }} />
    </AbsoluteFill>
  );
};`;
    }

    case "data-chart": {
      const { label, data } = scene.props as { label: string; data: Record<string, number> };
      const entries = Object.entries(data);
      const maxValue = Math.max(...entries.map(([, v]) => v), 1);

      return `const DataChartScene_${scene.id.replace(/-/g, "")} = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drawProgress = spring({ frame, fps, config: { damping: 20, stiffness: 60 } });
  const labelOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const entries = ${JSON.stringify(entries)};
  const maxValue = ${maxValue};

  return (
    <AbsoluteFill style={{
      background: "#0a0f1a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 80,
    }}>
      <div style={{
        opacity: labelOpacity,
        fontSize: 36,
        fontWeight: 700,
        color: "#fff",
        fontFamily: "Inter, system-ui, sans-serif",
        marginBottom: 48,
      }}>
        ${JSON.stringify(label)}
      </div>
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 24,
        height: 400,
        width: "80%",
        justifyContent: "center",
      }}>
        {entries.map(([name, value], i) => {
          const barHeight = (value / maxValue) * 360 * drawProgress;
          const barOpacity = interpolate(frame, [i * 5, i * 5 + 10], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: barOpacity }}>
              <div style={{
                fontSize: 18,
                color: "${brand.primaryColor}",
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 600,
                marginBottom: 8,
              }}>
                {Math.round(value * drawProgress)}
              </div>
              <div style={{
                width: 60,
                height: barHeight,
                background: \`linear-gradient(to top, ${brand.primaryColor}, ${brand.accentColor})\`,
                borderRadius: "6px 6px 0 0",
              }} />
              <div style={{
                fontSize: 14,
                color: "#9ca3af",
                fontFamily: "Inter, system-ui, sans-serif",
                marginTop: 8,
                textAlign: "center",
                maxWidth: 80,
              }}>
                {name}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};`;
    }
  }
}

export function generateRemotionCode(spec: VideoSpec): string {
  const lines: string[] = [];

  lines.push(`import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";`);
  lines.push("");

  for (const scene of spec.scenes) {
    const component = generateSceneComponent(scene, spec.brand, spec.fps);
    lines.push(component);
    lines.push("");
  }

  lines.push(`export const ${sanitizeComponentName(spec.title)} = () => {`);
  lines.push(`  return (`);
  lines.push(`    <AbsoluteFill style={{ backgroundColor: "#0a0f1a" }}>`);

  let currentFrame = 0;
  for (const scene of spec.scenes) {
    const durationFrames = secondsToFrames(scene.duration, spec.fps);
    const componentName = `${capitalizeSceneType(scene.type)}_${scene.id.replace(/-/g, "")}`;
    lines.push(`      <Sequence from={${currentFrame}} durationInFrames={${durationFrames}}>`);
    lines.push(`        <${componentName} />`);
    lines.push(`      </Sequence>`);
    currentFrame += durationFrames;
  }

  lines.push(`    </AbsoluteFill>`);
  lines.push(`  );`);
  lines.push(`};`);
  lines.push("");

  return lines.join("\n");
}

function sanitizeComponentName(title: string): string {
  const cleaned = title.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  if (cleaned.length === 0) return "LeadOSVideo";
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function capitalizeSceneType(type: VideoScene["type"]): string {
  const mapping: Record<VideoScene["type"], string> = {
    title: "TitleScene",
    feature: "FeatureScene",
    stat: "StatScene",
    testimonial: "TestimonialScene",
    cta: "CTAScene",
    transition: "TransitionScene",
    "data-chart": "DataChartScene",
  };
  return mapping[type];
}

export async function generateVideoSpec(params: {
  type: VideoType;
  tenantId: string;
  features?: string[];
  metrics?: Record<string, number>;
  testimonials?: { name: string; quote: string }[];
  ctaUrl?: string;
  ctaText?: string;
}): Promise<VideoSpec> {
  const tenant = await getTenant(params.tenantId);
  if (!tenant) {
    throw new Error(`Tenant not found: ${params.tenantId}`);
  }

  const brand = buildBrand(tenant);
  const scenes: VideoScene[] = [];

  switch (params.type) {
    case "product-demo": {
      scenes.push(buildTitleScene(tenant.brandName, "Product Demo"));
      scenes.push(buildTransitionScene());
      for (const feature of params.features ?? []) {
        scenes.push(buildFeatureScene(feature, `Discover how ${feature} transforms your workflow`, "\u2728"));
        scenes.push(buildTransitionScene());
      }
      if (params.ctaUrl) {
        scenes.push(buildCtaScene(params.ctaText ?? "Get Started", params.ctaUrl));
      }
      break;
    }

    case "data-report": {
      scenes.push(buildTitleScene(tenant.brandName, "Performance Report"));
      scenes.push(buildTransitionScene());
      const metrics = params.metrics ?? {};
      for (const [label, value] of Object.entries(metrics)) {
        scenes.push(buildStatScene(label, value, 0, ""));
      }
      if (Object.keys(metrics).length > 0) {
        scenes.push(buildTransitionScene());
        scenes.push(buildDataChartScene("Overview", metrics));
      }
      break;
    }

    case "launch-video": {
      scenes.push(buildTitleScene(tenant.brandName, "Now Available"));
      scenes.push(buildTransitionScene());
      for (const feature of params.features ?? []) {
        scenes.push(buildFeatureScene(feature, `Introducing ${feature}`, "\ud83d\ude80"));
        scenes.push(buildTransitionScene());
      }
      scenes.push(buildCtaScene(params.ctaText ?? "Try It Now", params.ctaUrl ?? tenant.siteUrl));
      break;
    }

    case "testimonial": {
      scenes.push(buildTitleScene(tenant.brandName, "What Our Customers Say"));
      scenes.push(buildTransitionScene());
      for (const t of params.testimonials ?? []) {
        scenes.push(buildTestimonialScene(t.name, t.quote));
        scenes.push(buildTransitionScene());
      }
      if (params.ctaUrl) {
        scenes.push(buildCtaScene(params.ctaText ?? "Join Them", params.ctaUrl));
      }
      break;
    }

    case "feature-highlight": {
      const features = params.features ?? [];
      const mainFeature = features[0] ?? "New Feature";
      scenes.push(buildTitleScene(mainFeature, `by ${tenant.brandName}`));
      scenes.push(buildTransitionScene());
      for (const feature of features) {
        scenes.push(buildFeatureScene(feature, `Deep dive into ${feature}`, "\ud83d\udca1"));
      }
      if (params.ctaUrl) {
        scenes.push(buildTransitionScene());
        scenes.push(buildCtaScene(params.ctaText ?? "Learn More", params.ctaUrl));
      }
      break;
    }

    case "weekly-recap": {
      scenes.push(buildTitleScene(tenant.brandName, "Weekly Performance Recap"));
      scenes.push(buildTransitionScene());
      const weeklyMetrics = params.metrics ?? {};
      for (const [label, value] of Object.entries(weeklyMetrics)) {
        scenes.push(buildStatScene(label, value, 0, ""));
      }
      if (Object.keys(weeklyMetrics).length > 0) {
        scenes.push(buildTransitionScene());
        scenes.push(buildDataChartScene("This Week at a Glance", weeklyMetrics));
      }
      break;
    }
  }

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  return {
    type: params.type,
    tenantId: params.tenantId,
    title: `${tenant.brandName} ${params.type.replace(/-/g, " ")}`,
    duration: totalDuration,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    fps: DEFAULT_FPS,
    brand,
    scenes,
  };
}

export async function generateProductDemoScript(tenantId: string, features: string[]): Promise<GeneratedVideo> {
  const spec = await generateVideoSpec({ type: "product-demo", tenantId, features });
  const remotionCode = generateRemotionCode(spec);
  return {
    spec,
    remotionCode,
    compositionId: `product-demo-${tenantId}-${Date.now()}`,
    estimatedRenderTime: Math.ceil(spec.duration * 2),
  };
}

export async function generateDataReportScript(tenantId: string, metrics: Record<string, number>): Promise<GeneratedVideo> {
  const spec = await generateVideoSpec({ type: "data-report", tenantId, metrics });
  const remotionCode = generateRemotionCode(spec);
  return {
    spec,
    remotionCode,
    compositionId: `data-report-${tenantId}-${Date.now()}`,
    estimatedRenderTime: Math.ceil(spec.duration * 2),
  };
}

export async function generateLaunchVideoScript(tenantId: string, features: string[], ctaUrl: string): Promise<GeneratedVideo> {
  const spec = await generateVideoSpec({ type: "launch-video", tenantId, features, ctaUrl });
  const remotionCode = generateRemotionCode(spec);
  return {
    spec,
    remotionCode,
    compositionId: `launch-video-${tenantId}-${Date.now()}`,
    estimatedRenderTime: Math.ceil(spec.duration * 2),
  };
}

export async function generateWeeklyRecapScript(tenantId: string): Promise<GeneratedVideo> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dateStr = oneWeekAgo.toISOString().split("T")[0];

  let snapshot: AnalyticsSnapshot;
  try {
    snapshot = await computeAnalyticsSnapshot(tenantId, dateStr);
  } catch {
    snapshot = {
      tenantId,
      period: dateStr,
      leads: { total: 0, bySource: {}, byNiche: {}, byStage: {}, avgScore: 0, hotCount: 0 },
      conversions: { total: 0, rate: 0, avgTimeToConvert: 0, byFunnel: {} },
      engagement: { emailsSent: 0, emailsOpened: 0, emailsClicked: 0, openRate: 0, clickRate: 0 },
      revenue: { total: 0, byNiche: {}, avgDealSize: 0 },
    };
  }

  const metrics: Record<string, number> = {
    "New Leads": snapshot.leads.total,
    "Hot Leads": snapshot.leads.hotCount,
    "Conversions": snapshot.conversions.total,
    "Conversion Rate": Math.round(snapshot.conversions.rate * 100),
    "Emails Sent": snapshot.engagement.emailsSent,
    "Open Rate": Math.round(snapshot.engagement.openRate * 100),
  };

  const spec = await generateVideoSpec({ type: "weekly-recap", tenantId, metrics });
  const remotionCode = generateRemotionCode(spec);
  return {
    spec,
    remotionCode,
    compositionId: `weekly-recap-${tenantId}-${Date.now()}`,
    estimatedRenderTime: Math.ceil(spec.duration * 2),
  };
}

export const VIDEO_TEMPLATES: { type: VideoType; name: string; description: string }[] = [
  { type: "product-demo", name: "Product Demo", description: "Showcase product features with animated scenes" },
  { type: "data-report", name: "Data Report", description: "Visualize metrics with animated charts and counters" },
  { type: "launch-video", name: "Launch Video", description: "Announce a product launch with feature highlights and CTA" },
  { type: "testimonial", name: "Testimonial Reel", description: "Animated customer testimonials with quotes" },
  { type: "feature-highlight", name: "Feature Highlight", description: "Deep dive into specific features" },
  { type: "weekly-recap", name: "Weekly Recap", description: "Auto-generated weekly performance summary" },
];
