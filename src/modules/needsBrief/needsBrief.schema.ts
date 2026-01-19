import { z } from "zod";

/**
 * Needs Brief (Module 4) — Business Case Development Analysis
 * Framework-aligned schema for structured LLM output.
 */

export const CallTypeSchema = z.enum([
  "discovery",
  "follow_up_discovery",
  "demo",
  "proposal",
  "closing",
  "support",
  "unknown",
]);

export const EvidenceSchema = z.object({
  quote: z.string().min(1).max(280),
  speaker: z.enum(["rep", "prospect", "unknown"]),
  reason: z.string().min(1).max(280),
});

export const NeedsBriefStatusSchema = z.enum([
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

export const DoNothingTestSchema = z.enum(["PASS", "FAIL"]);

export const NeedsBriefComponentKeySchema = z.enum([
  "tactical_needs",
  "strategic_importance",
  "cost_of_inaction",
  "desired_outcome",
  "business_impact_roi",
  "success_metrics_kpis",
  "differentiation",
]);

export const ComponentStatusSchema = z.enum([
  "ELITE",
  "STRONG",
  "ADEQUATE",
  "WEAK",
  "CRITICAL",
  "NA",
]);

export const StrategicCriteriaKeySchema = z.enum([
  "duration_12_plus_months",
  "champion_measured",
  "decision_maker_measured",
  "assigned_timeframes",
  "direct_strategic_impact",
]);

export const StrategicCriteriaAssessmentSchema = z.object({
  key: StrategicCriteriaKeySchema,
  label: z.string().min(1).max(80),
  met: z.boolean(),
  evidence: z.array(EvidenceSchema).min(0).max(2),
  note: z.string().min(1).max(240),
});

export const InactionCostTypeSchema = z.enum([
  "financial",
  "competitive",
  "timeline_event",
  "personal_political",
]);

export const InactionCostAssessmentSchema = z.object({
  type: InactionCostTypeSchema,
  discussed: z.boolean(),
  evidence: z.array(EvidenceSchema).min(0).max(2),
  note: z.string().min(1).max(240),
});

export const NeedsBriefComponentSchema = z.object({
  key: NeedsBriefComponentKeySchema,
  label: z.string().min(1).max(80),

  // Component scoring is per framework weights (10/20/etc)
  score: z.number().min(0).max(20),
  maxScore: z.number().min(1).max(20),

  status: ComponentStatusSchema,

  whatWasUncovered: z.array(z.string().min(1)).min(0).max(8),
  whatWasMissed: z.array(z.string().min(1)).min(0).max(8),

  coachingAskThis: z.array(z.string().min(1).max(240)).min(1).max(5),
  coachingWhyItMatters: z.string().min(1).max(360),

  evidence: z.array(EvidenceSchema).min(0).max(3),

  // Special fields used ONLY when relevant
  strategicCriteria: z.array(StrategicCriteriaAssessmentSchema).min(0).max(5),
  inactionCosts: z.array(InactionCostAssessmentSchema).min(0).max(4),

  // For differentiation: allow NA when no prescription happened
  prescriptionOccurred: z.boolean(),
  prescriptionPremature: z.boolean(),
});

export const AutoFlagKeySchema = z.enum([
  "COST_OF_INACTION_BELOW_12",
  "BUSINESS_IMPACT_BELOW_10",
  "STRATEGIC_IMPORTANCE_BELOW_9",
  "PREMATURE_PRESCRIPTION",
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

  componentKey: NeedsBriefComponentKeySchema,
  componentScore: z.number().min(0).max(20),
  componentMaxScore: z.number().min(1).max(20),

  theGap: z.string().min(1).max(520),
  whyThisKillsDeals: z.string().min(1).max(360),

  // Must be concrete + actionable
  theFix: z.array(z.string().min(1).max(240)).min(1).max(4),

  // Word-for-word practice snippet(s)
  practiceThis: z.array(z.string().min(1).max(520)).min(1).max(3),

  evidence: z.array(EvidenceSchema).min(0).max(3),
});

export const RepStrengthSchema = z.object({
  title: z.string().min(1).max(100),
  detail: z.string().min(1).max(520),
  evidence: z.array(EvidenceSchema).min(1).max(3),
});

export const NeedsBriefResponseSchema = z.object({
  module: z.literal("needs_brief"),
  version: z.string().min(1).max(20),

  callType: CallTypeSchema,

  // Overall module score is always 0-100
  overallScore: z.number().min(0).max(100),
  status: NeedsBriefStatusSchema,
  dealHealth: DealHealthSchema,

  // 47% do-nothing test
  doNothingTest: DoNothingTestSchema,
  doNothingTestEvidence: z.array(EvidenceSchema).min(0).max(2),
  doNothingTestAssessment: z.string().min(1).max(520),

  // High-level summary
  overallSummary: z.string().min(1).max(800),

  // Breakdown of 7 components (must always be present)
  components: z.array(NeedsBriefComponentSchema).length(7),

  // Auto flags (0..4)
  autoFlags: z.array(AutoFlagSchema).min(0).max(4),

  // Top 3 coaching priorities
  topPriorities: z.array(PrioritySchema).length(3),

  // What rep does well (required per framework)
  whatRepDoesWell: z.array(RepStrengthSchema).min(1).max(4),

  // “Brutal Truth” section
  brutalTruth: z.string().min(1).max(900),

  // Next call guidance
  nextCallMustAccomplish: z.array(z.string().min(1).max(240)).min(1).max(4),
  recommendedNextStep: z.string().min(1).max(360),
  openNextCallWith: z.string().min(1).max(240),

  // Optional metadata but required field (nullable)
  transcriptStats: z
    .object({
      wordCount: z.number().min(0).max(200000),
      durationSeconds: z.number().min(0).max(200000).nullable(),
    })
    .nullable(),
});

export type NeedsBriefResponse = z.infer<typeof NeedsBriefResponseSchema>;
