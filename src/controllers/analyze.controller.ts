import { Request, Response } from "express";
import { AnalyzerService } from "../services/analyzer/analyzer.service";
import { AnalysisRun } from "../db/models/AnalysisRun";

const analyzerService = new AnalyzerService();

function asNullableString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function pickOverallScore(result: any): number | null {
  const score = result?.overallScore;
  return typeof score === "number" && Number.isFinite(score) ? score : null;
}

function safeErrorJson(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  return {
    message: typeof err === "string" ? err : "Unknown error",
    raw: err as any,
  };
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

  const callType = asNullableString(req.body?.callType);
  const analysisFocus = asNullableString(req.body?.analysisFocus);
  const priorContext = asNullableString(req.body?.priorContext);

  // Context (middlewares)
  const userId = (req as any)?.auth?.userId as string | undefined;
  const orgId =
    ((req as any)?.org_id as string | undefined) ||
    ((req as any)?.auth?.orgId as string | undefined);

  try {
    const result = await analyzerService.analyze({
      transcript,
      callType,
      analysisFocus,
      priorContext,
    });

    // Guardar resultado (sin transcript)
    const analysisRun = await AnalysisRun.create({
      org_id: orgId || "00000000-0000-0000-0000-000000000000",
      user_id: userId || "00000000-0000-0000-0000-000000000000",
      module: String(result?.module || analysisFocus || "unknown"),
      overall_score: pickOverallScore(result),
      result_json: result,
      status: "done",
      error_json: null,
    });

        return res.status(200).json({
        analysisId: analysisRun.id,
        ...result,      
      })
  } catch (err) {
    // Intentar guardar fallo (sin transcript)
    try {
      await AnalysisRun.create({
        org_id: orgId || "00000000-0000-0000-0000-000000000000",
        user_id: userId || "00000000-0000-0000-0000-000000000000",
        module: String(analysisFocus || "unknown"),
        overall_score: null,
        result_json: { ok: false },
        status: "failed",
        error_json: safeErrorJson(err),
      });
    } catch (persistErr) {
      // Si falla la persistencia del error, al menos log
      console.error("Failed to persist analysis failure", persistErr);
    }

    console.error("analyzeController error", err);
    return res.status(500).json({
      ok: false,
      error: "ANALYZE_FAILED",
      message: err instanceof Error ? err.message : "Failed to analyze transcript",
    });
  }
}
