import { z } from "zod";

export const CallTypeSchema = z.enum(["discovery", "demo", "closing", "support"]).nullable();

export const EvidenceSchema = z.object({
  quote: z.string().min(1).max(280),
  speaker: z.enum(["rep", "prospect", "unknown"]).default("unknown"),
  reason: z.string().min(1).max(280),
});

export const StageKeySchema = z.enum([
  "rapport_opening",
  "todays_value_agenda",
  "discovery_middle",
  "qualification_o2c",
  "return_to_value",
  "objection_handling",
  "prescription_close",
]);

export const StageAnalysisSchema = z.object({
  key: StageKeySchema,
  label: z.string().min(1),
  score: z.number().min(0).max(100),
  severity: z.enum(["good", "needs_work", "critical"]),
  strengths: z.array(z.string().min(1)).max(8),
  gaps: z.array(z.string().min(1)).max(8),
  recommendations: z.array(z.string().min(1)).max(8),
  evidence: z.array(EvidenceSchema).min(1).max(3),
});

export const PrioritySchema = z.object({
  title: z.string().min(1).max(80),
  detail: z.string().min(1).max(280),
  evidence: z.array(EvidenceSchema).min(1).max(2),
});

export const AnalyzeResponseSchema = z.object({
  overallScore: z.number().min(0).max(100),
  overallSummary: z.string().min(1).max(600),
  callType: CallTypeSchema,
  topPriorities: z.array(PrioritySchema).min(2).max(6),
  stages: z.array(StageAnalysisSchema).length(7),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
