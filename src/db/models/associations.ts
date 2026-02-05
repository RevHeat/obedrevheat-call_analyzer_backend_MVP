import { User } from "./User";
import { Organization } from "./Organization";
import { OrganizationMember } from "./OrganizationMember";
import { RefreshToken } from "./RefreshToken";
import { Feedback } from "./Feedback";
import { AnalysisRun } from "./AnalysisRun";
import { PasswordResetToken } from "./PasswordResetToken";

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
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  RefreshToken.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });

  /**
   * User ↔ Feedback
   */
  User.hasMany(Feedback, {
    foreignKey: "created_by_user_id",
    as: "feedback",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });

  Feedback.belongsTo(User, {
    foreignKey: "created_by_user_id",
    as: "created_by",
  });

  /**
   * Organization ↔ AnalysisRun
   */
  Organization.hasMany(AnalysisRun, {
    foreignKey: "org_id",
    as: "analysis_runs",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  AnalysisRun.belongsTo(Organization, {
    foreignKey: "org_id",
    as: "organization",
  });

  /**
   * User ↔ AnalysisRun
   */
  User.hasMany(AnalysisRun, {
    foreignKey: "user_id",
    as: "analysis_runs",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  AnalysisRun.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });

  /**
 * User ↔ PasswordResetToken
 */
User.hasMany(PasswordResetToken, {
  foreignKey: "user_id",
  as: "password_reset_tokens",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

PasswordResetToken.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

};
