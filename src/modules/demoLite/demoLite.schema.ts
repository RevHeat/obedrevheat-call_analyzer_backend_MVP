import { z } from "zod";

export const CallTypeSchema = z.enum([
  "discovery",
  "follow_up_discovery",
  "demo",
  "proposal",
  "closing",
  "unknown",
]);

export const EvidenceSchema = z.object({
  quote: z.string().min(1).max(280),
  speaker: z.enum(["rep", "prospect", "unknown"]),
  reason: z.string().min(1).max(280),
});

export const DemoLiteStatusSchema = z.enum([
  "ELITE",
  "STRONG",
  "DEVELOPING",
  "WEAK",
  "CRITICAL",
]);

export const DemoLiteDimensionKeySchema = z.enum([
  "value_focus",
  "emotional_resonance",
  "control_through_curiosity",
  "impact_demonstration",
  "path_to_decision",
]);

export const SectionSeveritySchema = z.enum(["good", "needs_work", "critical"]);

export const DemoLiteDimensionSchema = z.object({
  key: DemoLiteDimensionKeySchema,
  label: z.string().min(1).max(80),
  score: z.number().min(0).max(100),
  maxScore: z.number().min(1).max(100),
  severity: SectionSeveritySchema,
  strengths: z.array(z.string().min(1)).min(0).max(8),
  gaps: z.array(z.string().min(1)).min(0).max(8),
  evidence: z.array(EvidenceSchema).min(0).max(3),
});

export const TalkTimeAnalysisSchema = z.object({
  repPercent: z.number().min(0).max(100),
  prospectPercent: z.number().min(0).max(100),
  assessment: z.string().min(1).max(280),
});

export const DemoLiteResponseSchema = z.object({
  module: z.literal("demo_lite"),
  version: z.string().min(1).max(20),

  callType: CallTypeSchema,

  overallScore: z.number().min(0).max(100),
  status: DemoLiteStatusSchema,

  dimensions: z.array(DemoLiteDimensionSchema).length(5),

  talkTimeAnalysis: TalkTimeAnalysisSchema,

  emotionalConnectionRead: z.string().min(1).max(600),
  topTwoFixes: z.array(z.string().min(1).max(520)).length(2),
  whatWorked: z.string().min(1).max(520),
  dealRead: z.string().min(1).max(360),

  whatRepDoesWell: z.array(z.object({
    title: z.string().min(1).max(100),
    detail: z.string().min(1).max(520),
  })).min(1).max(3),

  heresWhatHappened: z.string().min(1).max(900),

  nextCallMustAccomplish: z.array(z.string().min(1).max(240)).min(1).max(3),
  recommendedNextStep: z.string().min(1).max(360),
  openNextCallWith: z.string().min(1).max(240),

  transcriptStats: z
    .object({
      wordCount: z.number().min(0).max(200000),
      durationSeconds: z.number().min(0).max(200000).nullable(),
    })
    .nullable(),
});

export type DemoLiteResponse = z.infer<typeof DemoLiteResponseSchema>;
