import { llm } from "../../config/llm";
import { demoLitePrompt } from "./demoLite.prompt";
import { DemoLiteResponseSchema } from "./demoLite.schema";

export async function runDemoLiteChain(input: {
  transcript: string;
  callType?: string | null;
  analysisFocus?: string | null;
  priorContext?: string | null;
}) {
  const chain = demoLitePrompt.pipe(
    llm.withStructuredOutput(DemoLiteResponseSchema, { name: "DemoLite" })
  );

  const res: any = await chain.invoke({
    transcript: input.transcript,
    callType: input.callType ?? null,
    analysisFocus: input.analysisFocus ?? null,
    priorContext: input.priorContext ?? null,
  });

  return DemoLiteResponseSchema.parse(res);
}
