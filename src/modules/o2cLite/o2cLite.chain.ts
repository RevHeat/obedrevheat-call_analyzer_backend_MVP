import { llm } from "../../config/llm";
import { o2cLitePrompt } from "./o2cLite.prompt";
import { O2CLiteResponseSchema } from "./o2cLite.schema";

export async function runO2CLiteChain(input: {
  transcript: string;
  callType?: string | null;
  analysisFocus?: string | null;
  priorContext?: string | null;
}) {
  const chain = o2cLitePrompt.pipe(
    llm.withStructuredOutput(O2CLiteResponseSchema, { name: "O2CLite" })
  );

  const res: any = await chain.invoke({
    transcript: input.transcript,
    callType: input.callType ?? null,
    analysisFocus: input.analysisFocus ?? null,
    priorContext: input.priorContext ?? null,
  });

  // Normalize: ensure overallScore is computed from totalScore
  const totalScore = typeof res?.totalScore === "number" ? res.totalScore : 0;
  const normalized: any = {
    ...res,
    totalScore,
    overallScore:
      typeof res?.overallScore === "number"
        ? res.overallScore
        : Math.round((totalScore / 18) * 100),
  };

  return O2CLiteResponseSchema.parse(normalized);
}
