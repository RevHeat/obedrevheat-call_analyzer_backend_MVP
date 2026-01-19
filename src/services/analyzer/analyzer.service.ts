import { runNeedsBriefChain } from "./chains/needsBrief.chain";

export type AnalyzeInput = {
  transcript: string;
  callType?: string | null;
  dealSize?: string | null;
  repExperience?: string | null;
  analysisFocus?: string | null;
  priorContext?: string | null;
};

export class AnalyzerService {
  async analyze(input: AnalyzeInput) {
    return runNeedsBriefChain({
      transcript: input.transcript,
      callType: input.callType ?? null,
      dealSize: input.dealSize ?? null,
      repExperience: input.repExperience ?? null,
      analysisFocus: input.analysisFocus ?? null,
      priorContext: input.priorContext ?? null,
    });
  }
}
