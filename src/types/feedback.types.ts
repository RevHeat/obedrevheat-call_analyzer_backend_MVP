export type FeedbackType = "bug" | "review" | "idea" | "question" | "other";

export type FeedbackAttributes = {
  id: string;
  created_by_user_id: string;

  type: FeedbackType;
  message: string;
  rating: number | null;
};

export type FeedbackCreationAttributes = Omit<FeedbackAttributes, "id">;
