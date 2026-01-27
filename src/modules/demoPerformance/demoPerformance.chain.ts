import { llm } from "../../config/llm";
import { demoPerformancePrompt } from "./demoPerformance.prompt";
import {
  DemoAutoFlagLabels,
  DemoPerformanceResponseSchema,
  type DemoAutoFlagKey,
} from "./demoPerformance.schema";

export async function runDemoPerformanceChain(input: {
  transcript: string;
  callType?: string | null;
  analysisFocus?: string | null;
  priorContext?: string | null;
}) {
  const chain = demoPerformancePrompt.pipe(
    llm.withStructuredOutput(DemoPerformanceResponseSchema, { name: "DemoPerformance" })
  );

  const res: any = await chain.invoke({
    transcript: input.transcript,
    callType: input.callType ?? null,
    analysisFocus: input.analysisFocus ?? null,
    priorContext: input.priorContext ?? null,
  });

  const normalized: any = {
    ...res,
    autoFlags: Array.isArray(res?.autoFlags)
      ? res.autoFlags.map((f: any) => {
          const key = f?.key as DemoAutoFlagKey;
          return {
            ...f,
            label: f?.label ?? DemoAutoFlagLabels[key] ?? f?.key,
          };
        })
      : [],
  };

  return DemoPerformanceResponseSchema.parse(normalized);
}
