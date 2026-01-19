import { User } from "./User";
import { Organization } from "./Organization";
import { OrganizationMember } from "./OrganizationMember";

export const setupAssociations = () => {
  Organization.hasMany(OrganizationMember, { foreignKey: "org_id" });
  OrganizationMember.belongsTo(Organization, { foreignKey: "org_id" });

  User.hasMany(OrganizationMember, { foreignKey: "user_id" });
  OrganizationMember.belongsTo(User, { foreignKey: "user_id" });

  // Many-to-many sugar (opcional)
  Organization.belongsToMany(User, {
    through: OrganizationMember,
    foreignKey: "org_id",
    otherKey: "user_id",
  });

  User.belongsToMany(Organization, {
    through: OrganizationMember,
    foreignKey: "user_id",
    otherKey: "org_id",
  });
};
