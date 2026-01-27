// backend/src/schemas/demoPerformance.schema.ts
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

export const DemoPerformanceStatusSchema = z.enum([
  "ELITE",
  "STRONG",
  "ADEQUATE",
  "WEAK",
  "CRITICAL",
]);

export const DealHealthSchema = z.enum([
  "HIGH_CONFIDENCE",
  "NEEDS_WORK",
  "AT_RISK",
  "DEAD_WITHOUT_INTERVENTION",
  "DEAD",
]);

export const DemoDimensionKeySchema = z.enum([
  "value_focus",
  "problem_amplification",
  "control_through_curiosity",
  "impact_demonstration",
  "path_to_decision",
]);

export const SectionSeveritySchema = z.enum(["good", "needs_work", "critical"]);

export const DemoDimensionSchema = z.object({
  key: DemoDimensionKeySchema,
  label: z.string().min(1).max(80),

  score: z.number().min(0).max(100),
  maxScore: z.number().min(1).max(100),

  severity: SectionSeveritySchema,

  strengths: z.array(z.string().min(1)).min(0).max(8),
  gaps: z.array(z.string().min(1)).min(0).max(8),

  recommendations: z.array(z.string().min(1).max(240)).min(1).max(8),
  coachingAskThis: z.array(z.string().min(1).max(240)).min(1).max(6),

  evidence: z.array(EvidenceSchema).min(0).max(3),
});

export const AutoFlagKeySchema = z.enum([
  "VALUE_FOCUS_BELOW_14",
  "IMPACT_DEMONSTRATION_BELOW_14",
  "FEATURE_TOUR",
  "NO_PATH_TO_DECISION",
]);

export type DemoAutoFlagKey = z.infer<typeof AutoFlagKeySchema>;

export const DemoAutoFlagLabelSchema = z.record(AutoFlagKeySchema, z.string().min(1).max(48));

export const DemoAutoFlagLabels = {
  VALUE_FOCUS_BELOW_14: "Weak value focus",
  IMPACT_DEMONSTRATION_BELOW_14: "Weak impact demo",
  FEATURE_TOUR: "Feature tour",
  NO_PATH_TO_DECISION: "No decision path",
} satisfies Record<DemoAutoFlagKey, string>;

export const AutoFlagSchema = z.object({
  key: AutoFlagKeySchema,
  severity: z.enum(["CRITICAL", "HIGH"]),
  label: z.string().min(1).max(48),
  message: z.string().min(1).max(320),
  evidence: z.array(EvidenceSchema).min(0).max(2),
});

export const PrioritySchema = z.object({
  rank: z.number().min(1).max(3),
  title: z.string().min(1).max(100),

  dimensionKey: DemoDimensionKeySchema,
  dimensionScore: z.number().min(0).max(100),
  dimensionMaxScore: z.number().min(1).max(100),

  theGap: z.string().min(1).max(520),
  whyThisKillsDeals: z.string().min(1).max(360),

  theFix: z.array(z.string().min(1).max(240)).min(1).max(4),
  practiceThis: z.array(z.string().min(1).max(520)).min(1).max(3),

  evidence: z.array(EvidenceSchema).min(0).max(3),
});

export const RepStrengthSchema = z.object({
  title: z.string().min(1).max(100),
  detail: z.string().min(1).max(520),
  evidence: z.array(EvidenceSchema).min(1).max(3),
});

export const DemoPerformanceResponseSchema = z.object({
  module: z.literal("demo_performance"),
  version: z.string().min(1).max(20),

  callType: CallTypeSchema,

  overallScore: z.number().min(0).max(100),
  status: DemoPerformanceStatusSchema,
  dealHealth: DealHealthSchema,

  overallSummary: z.string().min(1).max(900),

  dimensions: z.array(DemoDimensionSchema).length(5),

  autoFlags: z.array(AutoFlagSchema).min(0).max(6),

  topPriorities: z.array(PrioritySchema).length(3),

  whatRepDoesWell: z.array(RepStrengthSchema).min(1).max(4),

  heresWhatHappened: z.string().min(1).max(900),

  nextCallMustAccomplish: z.array(z.string().min(1).max(240)).min(1).max(4),
  recommendedNextStep: z.string().min(1).max(360),
  openNextCallWith: z.string().min(1).max(240),

  transcriptStats: z
    .object({
      wordCount: z.number().min(0).max(200000),
      durationSeconds: z.number().min(0).max(200000).nullable(),
    })
    .nullable(),
});

export type DemoPerformanceResponse = z.infer<typeof DemoPerformanceResponseSchema>;
