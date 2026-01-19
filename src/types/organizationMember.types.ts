import { Optional } from "sequelize";

export type OrganizationMemberRole = "admin" | "member";
export type OrganizationMemberStatus = "active" | "invited" | "disabled";

export type OrganizationMemberAttributes = {
  org_id: string;
  user_id: string;
  role: OrganizationMemberRole;
  status: OrganizationMemberStatus;
  joined_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
};

export type OrganizationMemberCreationAttributes = Optional<
  OrganizationMemberAttributes,
  "status" | "joined_at" | "created_at" | "updated_at"
>;
