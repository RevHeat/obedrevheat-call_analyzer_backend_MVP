import { runNeedsBriefChain } from "./chains/needsBrief.chain";

export type AnalyzeInput = {
  transcript: string;
  callType?: string | null;
  analysisFocus?: string | null;
  priorContext?: string | null;
};

export class AnalyzerService {
  async analyze(input: AnalyzeInput) {
    return runNeedsBriefChain({
      transcript: input.transcript,
      callType: input.callType ?? null,
      analysisFocus: input.analysisFocus ?? null,
      priorContext: input.priorContext ?? null,
    });
  }
}
