import { llm } from "../../config/llm";
import { demoPerformancePrompt } from "./demoPerformance.prompt";
import { DemoPerformanceResponseSchema } from "./demoPerformance.schema";

export async function runDemoPerformanceChain(input: {
  transcript: string;
  callType?: string | null;
  analysisFocus?: string | null;
  priorContext?: string | null;
}) {
  const chain = demoPerformancePrompt.pipe(
    llm.withStructuredOutput(DemoPerformanceResponseSchema, { name: "DemoPerformance" })
  );

  return chain.invoke({
    transcript: input.transcript,
    callType: input.callType ?? null,
    analysisFocus: input.analysisFocus ?? null,
    priorContext: input.priorContext ?? null,
  });
}
