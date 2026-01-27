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

export const DiscoveryQualityStatusSchema = z.enum([
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

export const DiscoverySectionKeySchema = z.enum([
  "opening_questions",
  "discovery_depth",
  "strategic_positioning",
  "objection_handling",
]);

export const SectionSeveritySchema = z.enum(["good", "needs_work", "critical"]);

export const DiscoverySectionSchema = z.object({
  key: DiscoverySectionKeySchema,
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
  "DISCOVERY_DEPTH_BELOW_22",
  "STRATEGIC_POSITIONING_BELOW_12",
  "ACCEPTED_VAGUE_ANSWERS",
  "PREMATURE_PITCHING",
]);

export const AutoFlagSchema = z.object({
  key: AutoFlagKeySchema,
  severity: z.enum(["CRITICAL", "HIGH"]),
  message: z.string().min(1).max(320),
  evidence: z.array(EvidenceSchema).min(0).max(2),
});

export const PrioritySchema = z.object({
  rank: z.number().min(1).max(3),
  title: z.string().min(1).max(100),

  sectionKey: DiscoverySectionKeySchema,
  sectionScore: z.number().min(0).max(100),
  sectionMaxScore: z.number().min(1).max(100),

  theGap: z.string().min(1).max(520),
  whyThisKillsDeals: z.string().min(1).max(360),

  theFix: z.array(z.string().min(1).max(240)).min(1).max(4),

  evidence: z.array(EvidenceSchema).min(0).max(3),
});

export const RepStrengthSchema = z.object({
  title: z.string().min(1).max(100),
  detail: z.string().min(1).max(520),
  evidence: z.array(EvidenceSchema).min(1).max(3),
});

export const DiscoveryQualityResponseSchema = z.object({
  module: z.literal("discovery_quality"),
  version: z.string().min(1).max(20),

  callType: CallTypeSchema,

  overallScore: z.number().min(0).max(100),
  status: DiscoveryQualityStatusSchema,
  dealHealth: DealHealthSchema,

  overallSummary: z.string().min(1).max(900),

  sections: z.array(DiscoverySectionSchema).length(4),

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

export type DiscoveryQualityResponse = z.infer<typeof DiscoveryQualityResponseSchema>;
