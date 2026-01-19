import { Optional } from "sequelize";

export type OrganizationAttributes = {
  id: string;
  name: string;
  slug: string;
  created_by_user_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
};

export type OrganizationCreationAttributes = Optional<
  OrganizationAttributes,
  "id" | "created_by_user_id" | "created_at" | "updated_at"
>;
