import { llm } from "../../../config/llm";
import { needsBriefPrompt } from "../../../modules/needsBrief/needsBrief.prompt";
import { NeedsBriefResponseSchema } from "../../../modules/needsBrief/needsBrief.schema";

export async function runNeedsBriefChain(input: {
  transcript: string;
  callType?: string | null;
  analysisFocus?: string | null;
  priorContext?: string | null;
}) {
  const chain = needsBriefPrompt.pipe(
    llm.withStructuredOutput(NeedsBriefResponseSchema, { name: "NeedsBrief" })
  );

  return chain.invoke({
    transcript: input.transcript,
    callType: input.callType ?? null,
    analysisFocus: input.analysisFocus ?? null,
    priorContext: input.priorContext ?? null,
  });
}
