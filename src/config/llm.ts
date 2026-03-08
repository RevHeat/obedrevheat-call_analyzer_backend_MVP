import { ChatOpenAI } from "@langchain/openai";

export const llm = new ChatOpenAI({
  model: "gpt-4.1-mini",
  temperature: 0,
  timeout: 90_000,
  maxRetries: 2,
});
