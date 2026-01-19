import { User } from "./User";
import { Organization } from "./Organization";
import { OrganizationMember } from "./OrganizationMember";
import { RefreshToken } from "./RefreshToken";

export const setupAssociations = () => {
  /**
   * Organization ↔ OrganizationMember
   */
  Organization.hasMany(OrganizationMember, {
    foreignKey: "org_id",
    as: "memberships",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  OrganizationMember.belongsTo(Organization, {
    foreignKey: "org_id",
    as: "organization",
  });

  /**
   * User ↔ OrganizationMember
   */
  User.hasMany(OrganizationMember, {
    foreignKey: "user_id",
    as: "memberships",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  OrganizationMember.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });

  /**
   * Many-to-many sugar
   * User ↔ Organization through OrganizationMember
   */
  Organization.belongsToMany(User, {
    through: OrganizationMember,
    foreignKey: "org_id",
    otherKey: "user_id",
    as: "users",
  });

  User.belongsToMany(Organization, {
    through: OrganizationMember,
    foreignKey: "user_id",
    otherKey: "org_id",
    as: "organizations",
  });

  /**
   * User ↔ RefreshToken
   */
  User.hasMany(RefreshToken, {
    foreignKey: "user_id",
    as: "refresh_tokens",
    onDelete: "CASCADE", // 🔐 borrar tokens al borrar user
    onUpdate: "CASCADE",
  });

  RefreshToken.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });
};
