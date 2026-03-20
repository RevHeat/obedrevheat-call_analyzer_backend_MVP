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

export const DiscoveryLiteStatusSchema = z.enum([
  "ELITE",
  "STRONG",
  "DEVELOPING",
  "WEAK",
  "CRITICAL",
]);

export const DiscoveryLiteDimensionKeySchema = z.enum([
  "emotional_connection_problem_depth",
  "decision_clarity",
  "strategic_questioning",
  "next_step_commitment",
]);

export const SectionSeveritySchema = z.enum(["good", "needs_work", "critical"]);

export const DiscoveryLiteDimensionSchema = z.object({
  key: DiscoveryLiteDimensionKeySchema,
  label: z.string().min(1).max(80),
  score: z.number().min(0).max(100),
  maxScore: z.number().min(1).max(100),
  severity: SectionSeveritySchema,
  strengths: z.array(z.string().min(1)).min(0).max(8),
  gaps: z.array(z.string().min(1)).min(0).max(8),
  evidence: z.array(EvidenceSchema).min(0).max(3),
});

export const PerfectMeetingStepKeySchema = z.enum([
  "set_the_agenda",
  "uncover_the_problem",
  "identify_decision_maker_process",
  "find_roadblocks_early",
  "align_on_next_steps",
]);

export const PerfectMeetingStepStatusSchema = z.enum(["pass", "warning", "fail"]);

export const PerfectMeetingStepSchema = z.object({
  key: PerfectMeetingStepKeySchema,
  label: z.string().min(1).max(80),
  status: PerfectMeetingStepStatusSchema,
  note: z.string().min(1).max(280),
});

export const DiscoveryLiteResponseSchema = z.object({
  module: z.literal("discovery_lite"),
  version: z.string().min(1).max(20),

  callType: CallTypeSchema,

  overallScore: z.number().min(0).max(100),
  status: DiscoveryLiteStatusSchema,

  dimensions: z.array(DiscoveryLiteDimensionSchema).length(4),

  perfectMeetingLite: z.array(PerfectMeetingStepSchema).length(5),

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

export type DiscoveryLiteResponse = z.infer<typeof DiscoveryLiteResponseSchema>;
