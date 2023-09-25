export enum Plans {
  FREE = 'FREE',
  SOLO = 'SOLO',
  TEAM = 'TEAM',
  ENTERPRISE = 'ENTERPRISE'
}
type TeamRoles = 'owner' | 'user';
export type User = {
  uid: string;
  email: string;
  plan: Plans;
  teamId: string;
  teamRole: TeamRoles;
  templatesQuota: number;
  templatesQuotaUsed: number;
  subscription: {
    renewOn: number;
    createdOn: number;
    frequency: string;
  };
};

export type UserProperties = {
  [T in keyof User]?: User[T];
};
