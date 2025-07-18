import { Plans } from './plans.model';

/**
 * Represents the roles a team member can have within a team.
 *
 * Regular roles:
 * - 'owner': The team owner with full permissions.
 * - 'user': A standard team member with basic permissions.
 *
 * Special roles:
 * - 'admin': A member with team management and billing permissions.
 * - 'billing': A member with billing management permissions only.
 */
export type TeamRoles = 'owner' | 'user' | 'billing' | 'team_admin';

export type TeamMember = {
  uid: string;
  email: string;
  role: TeamRoles;
};

export type Team = {
  seats: number;
  plan: Plans;
  members: TeamMember[];
};
