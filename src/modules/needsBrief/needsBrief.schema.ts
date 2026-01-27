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
  score: z.number().min(0).max(20),
  maxScore: z.number().min(1).max(20),
  status: ComponentStatusSchema,
  whatWasUncovered: z.array(z.string().min(1)).min(0).max(8),
  whatWasMissed: z.array(z.string().min(1)).min(0).max(8),
  coachingAskThis: z.array(z.string().min(1).max(240)).min(1).max(5),
  coachingWhyItMatters: z.string().min(1).max(360),
  evidence: z.array(EvidenceSchema).min(0).max(3),
  strategicCriteria: z.array(StrategicCriteriaAssessmentSchema).min(0).max(5),
  inactionCosts: z.array(InactionCostAssessmentSchema).min(0).max(4),
  prescriptionOccurred: z.boolean(),
  prescriptionPremature: z.boolean(),
});

export const AutoFlagKeySchema = z.enum([
  "COST_OF_INACTION_BELOW_12",
  "BUSINESS_IMPACT_BELOW_10",
  "STRATEGIC_IMPORTANCE_BELOW_9",
  "PREMATURE_PRESCRIPTION",
]);

export type NeedsBriefAutoFlagKey = z.infer<typeof AutoFlagKeySchema>;

export const NeedsBriefAutoFlagLabelSchema = z.record(
  AutoFlagKeySchema,
  z.string().min(1).max(48)
);

export const NeedsBriefAutoFlagLabels = {
  COST_OF_INACTION_BELOW_12: "Weak urgency",
  BUSINESS_IMPACT_BELOW_10: "No business case",
  STRATEGIC_IMPORTANCE_BELOW_9: "Not strategic",
  PREMATURE_PRESCRIPTION: "Solution too early",
} satisfies Record<NeedsBriefAutoFlagKey, string>;

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
  componentKey: NeedsBriefComponentKeySchema,
  componentScore: z.number().min(0).max(20),
  componentMaxScore: z.number().min(1).max(20),
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

export const NeedsBriefResponseSchema = z.object({
  module: z.literal("needs_brief"),
  version: z.string().min(1).max(20),
  callType: CallTypeSchema,
  overallScore: z.number().min(0).max(100),
  status: NeedsBriefStatusSchema,
  dealHealth: DealHealthSchema,
  doNothingTest: DoNothingTestSchema,
  doNothingTestEvidence: z.array(EvidenceSchema).min(0).max(2),
  doNothingTestAssessment: z.string().min(1).max(520),
  overallSummary: z.string().min(1).max(800),
  components: z.array(NeedsBriefComponentSchema).length(7),
  autoFlags: z.array(AutoFlagSchema).min(0).max(4),
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

export type NeedsBriefResponse = z.infer<typeof NeedsBriefResponseSchema>;
