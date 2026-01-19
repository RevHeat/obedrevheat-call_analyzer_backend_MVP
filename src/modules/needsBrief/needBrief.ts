import { llm } from "../../config/llm";
import { NEEDS_BRIEF_PROMPT } from "./needsBrief.prompt";
import { NeedsBriefResponseSchema } from "./needsBrief.schema";

type NeedsBriefParams = {
  transcript: string;
  callType?: string | null;
  dealSize?: string | null;
  repExperience?: string | null;
  analysisFocus?: string | null;
  priorContext?: string | null;
};

export async function runNeedsBrief(params: NeedsBriefParams) {
  const structuredLlm = llm.withStructuredOutput(
    NeedsBriefResponseSchema,
    { name: "NeedsBrief" }
  );

  const chain = NEEDS_BRIEF_PROMPT.pipe(structuredLlm);

  return chain.invoke({
    transcript: params.transcript,
    callType: params.callType ?? null,
    dealSize: params.dealSize ?? null,
    repExperience: params.repExperience ?? null,
    analysisFocus: params.analysisFocus ?? null,
    priorContext: params.priorContext ?? null,
  });
}
