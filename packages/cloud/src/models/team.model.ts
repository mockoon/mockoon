import { Plans } from './plans.model';

export type TeamRoles = 'owner' | 'user';

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
