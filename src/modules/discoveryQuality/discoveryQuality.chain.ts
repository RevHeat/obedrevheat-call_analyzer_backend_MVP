import { llm } from "../../config/llm";
import { discoveryQualityPrompt } from "./discoveryQuality.prompt";
import {
  DiscoveryAutoFlagLabels,
  DiscoveryQualityResponseSchema,
  type DiscoveryAutoFlagKey,
} from "./discoveryQuality.schema";

export async function runDiscoveryQualityChain(input: {
  transcript: string;
  callType?: string | null;
  analysisFocus?: string | null;
  priorContext?: string | null;
}) {
  const chain = discoveryQualityPrompt.pipe(
    llm.withStructuredOutput(DiscoveryQualityResponseSchema, { name: "DiscoveryQuality" })
  );

  const res: any = await chain.invoke({
    transcript: input.transcript,
    callType: input.callType ?? null,
    analysisFocus: input.analysisFocus ?? null,
    priorContext: input.priorContext ?? null,
  });

  const normalized: any = {
    ...res,
    heresWhatHappened: res?.heresWhatHappened ?? res?.brutalTruth,
    autoFlags: Array.isArray(res?.autoFlags)
      ? res.autoFlags.map((f: any) => {
          const key = f?.key as DiscoveryAutoFlagKey;
          return {
            ...f,
            label: f?.label ?? DiscoveryAutoFlagLabels[key] ?? f?.key,
          };
        })
      : [],
  };

  delete normalized.brutalTruth;

  return DiscoveryQualityResponseSchema.parse(normalized);
}
