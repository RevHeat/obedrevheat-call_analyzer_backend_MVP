import { llm } from "../../config/llm";
import { needsBriefPrompt } from "./needsBrief.prompt";
import { NeedsBriefResponseSchema } from "./needsBrief.schema";

type NeedsBriefParams = {
  transcript: string;
  callType?: string | null;
  analysisFocus?: string | null;
  priorContext?: string | null;
};

export async function runNeedsBrief(params: NeedsBriefParams) {
  const structuredLlm = llm.withStructuredOutput(NeedsBriefResponseSchema, {
    name: "NeedsBrief",
  });

  const chain = needsBriefPrompt.pipe(structuredLlm);

  const res: any = await chain.invoke({
    transcript: params.transcript,
    callType: params.callType ?? null,
    analysisFocus: params.analysisFocus ?? null,
    priorContext: params.priorContext ?? null,
  });

  const normalized: any = {
    ...res,
    heresWhatHappened: res?.heresWhatHappened ?? res?.brutalTruth,
  };
  delete normalized.brutalTruth;

  return NeedsBriefResponseSchema.parse(normalized);
}
