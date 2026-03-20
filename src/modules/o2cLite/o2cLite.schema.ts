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

export const O2CLiteScoringBandSchema = z.enum([
  "HIGH_CONFIDENCE",
  "NEEDS_WORK",
  "AT_RISK",
  "DEAD",
]);

export const O2CLiteFactorKeySchema = z.enum([
  "business_need",
  "decision_maker",
  "champion",
  "business_case",
  "decision_process",
  "paper_process_urgency",
]);

export const O2CLiteFactorSchema = z.object({
  key: O2CLiteFactorKeySchema,
  label: z.string().min(1).max(80),
  score: z.number().min(0).max(3),
  maxScore: z.literal(3),
  oneLinerRead: z.string().min(1).max(280),
  evidence: z.array(EvidenceSchema).min(0).max(3),
  quickCloseMove: z.string().min(1).max(520).nullable(),
});

export const O2CLiteResponseSchema = z.object({
  module: z.literal("o2c_lite"),
  version: z.string().min(1).max(20),

  callType: CallTypeSchema,

  totalScore: z.number().min(0).max(18),
  overallScore: z.number().min(0).max(100),
  scoringBand: O2CLiteScoringBandSchema,

  factors: z.array(O2CLiteFactorSchema).length(6),

  dealMomentum: z.string().min(1).max(360),
  topMovesToClose: z.array(z.string().min(1).max(520)).min(1).max(3),
  watchOutFor: z.string().min(1).max(520).nullable(),

  velocityFlag: z.string().min(1).max(520).nullable(),
  stallWarning: z.string().min(1).max(520).nullable(),
  escalationPrompt: z.string().min(1).max(520).nullable(),

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

export type O2CLiteResponse = z.infer<typeof O2CLiteResponseSchema>;
