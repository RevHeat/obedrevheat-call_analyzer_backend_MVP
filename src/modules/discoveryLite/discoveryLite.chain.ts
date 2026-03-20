import { llm } from "../../config/llm";
import { discoveryLitePrompt } from "./discoveryLite.prompt";
import { DiscoveryLiteResponseSchema } from "./discoveryLite.schema";

export async function runDiscoveryLiteChain(input: {
  transcript: string;
  callType?: string | null;
  analysisFocus?: string | null;
  priorContext?: string | null;
}) {
  const chain = discoveryLitePrompt.pipe(
    llm.withStructuredOutput(DiscoveryLiteResponseSchema, {
      name: "DiscoveryLite",
    })
  );

  const res: any = await chain.invoke({
    transcript: input.transcript,
    callType: input.callType ?? null,
    analysisFocus: input.analysisFocus ?? null,
    priorContext: input.priorContext ?? null,
  });

  return DiscoveryLiteResponseSchema.parse(res);
}
