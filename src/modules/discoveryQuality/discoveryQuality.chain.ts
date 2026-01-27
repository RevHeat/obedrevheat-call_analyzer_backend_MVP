import { llm } from "../../config/llm";
import { discoveryQualityPrompt } from "./discoveryQuality.prompt";
import { DiscoveryQualityResponseSchema } from "./discoveryQuality.schema";

export async function runDiscoveryQualityChain(input: {
  transcript: string;
  callType?: string | null;
  analysisFocus?: string | null;
  priorContext?: string | null;
}) {
  const chain = discoveryQualityPrompt.pipe(
    llm.withStructuredOutput(DiscoveryQualityResponseSchema, { name: "DiscoveryQuality" })
  );

  return chain.invoke({
    transcript: input.transcript,
    callType: input.callType ?? null,
    analysisFocus: input.analysisFocus ?? null,
    priorContext: input.priorContext ?? null,
  });
}
