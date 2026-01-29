import { Feedback } from "../db/models/Feedback";


export type FeedbackType = "bug" | "review" | "idea" | "question" | "other";

export type CreateFeedbackInput = {
  type: FeedbackType;
  message: string;
  rating: number | null;
};

export type NormalizedFeedback = {
  type: FeedbackType;
  message: string;
  rating: number | null;
};

export function normalizeCreate(input: CreateFeedbackInput): NormalizedFeedback {
  
  //type defined as FeedbackType from the CreateFeedbackInput
  const type = input.type;
  const message = (input.message ?? "").trim();
   if (!message || message.length < 3) {
    throw new Error("message must be at least 3 characters");
  }
  if (type === "review") {
    const r = input.rating;

    if (typeof r !== "number" || !Number.isInteger(r) || r < 1 || r > 5) {
      throw new Error("rating must be an integer between 1 and 5 for review");
    }

    return { type, message, rating: r };
  }

  return { type, message, rating: null };

}

export async function createFeedback(
  userId: string,
  input: CreateFeedbackInput
): Promise<{ ok: true }> {
  const normalized = normalizeCreate(input);

  await Feedback.create({
    created_by_user_id: userId,
    type: normalized.type,
    message: normalized.message,
    rating: normalized.rating,
  });

  return { ok: true };
}