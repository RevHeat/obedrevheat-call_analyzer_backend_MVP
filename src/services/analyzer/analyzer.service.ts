import { runNeedsBriefChain } from "./chains/needsBrief.chain";
import { runDiscoveryQualityChain } from "../../modules/discoveryQuality/discoveryQuality.chain";
import { runDemoPerformanceChain } from "../../modules/demoPerformance/demoPerformance.chain";
import { runO2CLiteChain } from "../../modules/o2cLite/o2cLite.chain";
import { runDiscoveryLiteChain } from "../../modules/discoveryLite/discoveryLite.chain";
import { runDemoLiteChain } from "../../modules/demoLite/demoLite.chain";
import { withConcurrencyLimit } from "./concurrencyLimit";

export type AnalyzeInput = {
  transcript: string;
  callType?: string | null;
  analysisFocus?: string | null;
  priorContext?: string | null;
  dealType?: "smb" | "enterprise" | null;
};

export class AnalyzerService {
  async analyze(input: AnalyzeInput) {
    return withConcurrencyLimit(() => this._runChain(input));
  }

  private async _runChain(input: AnalyzeInput) {
    const focus = (input.analysisFocus ?? "").trim();
    const chainInput = {
      transcript: input.transcript,
      callType: input.callType ?? null,
      analysisFocus: input.analysisFocus ?? null,
      priorContext: input.priorContext ?? null,
    };

    // SMB / Lite routing
    if (input.dealType === "smb") {
      if (focus === "Discovery Quality" || focus === "Discovery Quality (later)") {
        return runDiscoveryLiteChain(chainInput);
      }
      if (focus === "Demo Performance" || focus === "Demo Performance (later)") {
        return runDemoLiteChain(chainInput);
      }
      // Default for SMB: O2C Lite (replaces Needs Brief)
      return runO2CLiteChain(chainInput);
    }

    // Enterprise / Full routing (default — backward compatible)
    if (focus === "Discovery Quality" || focus === "Discovery Quality (later)") {
      return runDiscoveryQualityChain(chainInput);
    }

    if (focus === "Demo Performance" || focus === "Demo Performance (later)") {
      return runDemoPerformanceChain(chainInput);
    }

    return runNeedsBriefChain(chainInput);
  }
}
