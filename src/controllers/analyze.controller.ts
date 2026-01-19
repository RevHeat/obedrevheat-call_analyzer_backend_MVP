import { Request, Response } from "express";
import { AnalyzerService } from "../services/analyzer/analyzer.service";

const analyzerService = new AnalyzerService();

function asNullableString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function analyzeController(req: Request, res: Response) {
  const transcriptRaw = req.body?.transcript;

  if (typeof transcriptRaw !== "string" || transcriptRaw.trim().length < 10) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      message: "transcript is required and must be a string (min 10 chars).",
    });
  }

  const transcript = transcriptRaw.trim();

  // Optional fields (sanitize to string|null)
  const callType = asNullableString(req.body?.callType);
  const dealSize = asNullableString(req.body?.dealSize);
  const repExperience = asNullableString(req.body?.repExperience);
  const analysisFocus = asNullableString(req.body?.analysisFocus);
  const priorContext = asNullableString(req.body?.priorContext);

  const result = await analyzerService.analyze({
    transcript,
    callType,
    dealSize,
    repExperience,
    analysisFocus,
    priorContext,
  });

  return res.status(200).json(result);
}
