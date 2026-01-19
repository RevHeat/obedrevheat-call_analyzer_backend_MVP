import { Optional } from "sequelize";

export type UserAttributes = {
    id: string;               // UUID
    auth0_user_id: string;
    email: string;
    email_verified: boolean;
    full_name?: string | null;
    avatar_url?: string | null;
    last_seen_at?: Date | null;
    created_at?: Date;
    updated_at?: Date;
}

export type UserCreationAttributes = Optional<
  UserAttributes,
  "id" | "email_verified" | "created_at" | "updated_at" | "last_seen_at">;