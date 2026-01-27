import { runNeedsBriefChain } from "./chains/needsBrief.chain";
import { runDiscoveryQualityChain } from "../../modules/discoveryQuality/discoveryQuality.chain";
import { runDemoPerformanceChain } from "../../modules/demoPerformance/demoPerformance.chain";

export type AnalyzeInput = {
  transcript: string;
  callType?: string | null;
  analysisFocus?: string | null;
  priorContext?: string | null;
};

export class AnalyzerService {
  async analyze(input: AnalyzeInput) {
    const focus = (input.analysisFocus ?? "").trim();

    if (focus === "Discovery Quality" || focus === "Discovery Quality (later)") {
      return runDiscoveryQualityChain({
        transcript: input.transcript,
        callType: input.callType ?? null,
        analysisFocus: input.analysisFocus ?? null,
        priorContext: input.priorContext ?? null,
      });
    }

    if (focus === "Demo Performance" || focus === "Demo Performance (later)") {
      return runDemoPerformanceChain({
        transcript: input.transcript,
        callType: input.callType ?? null,
        analysisFocus: input.analysisFocus ?? null,
        priorContext: input.priorContext ?? null,
      });
    }

    return runNeedsBriefChain({
      transcript: input.transcript,
      callType: input.callType ?? null,
      analysisFocus: input.analysisFocus ?? null,
      priorContext: input.priorContext ?? null,
    });
  }
}
