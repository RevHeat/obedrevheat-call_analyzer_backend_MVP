import { llm } from "../../../config/llm";
import { analyzePrompt } from "../prompts/analyze.prompt";
import { AnalyzeResponseSchema } from "../schemas/analyze.schema";

export async function runAnalyzeChain(input:{transcript:string}){


    const chain = analyzePrompt.pipe(

        //Call Analysis used as tracer name 
        llm.withStructuredOutput(AnalyzeResponseSchema,{name:"CallAnalysis"})
    );
    
    return chain.invoke({ transcript: input.transcript });

}