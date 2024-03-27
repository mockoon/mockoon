import { Frequency, Plans } from './plans.model';
import { TeamRoles } from './team.model';

export type User = {
  uid: string;
  email: string;
  plan: Plans;
  teamId: string;
  teamRole: TeamRoles;
  cloudSyncItemsQuota: number;
  cloudSyncItemsQuotaUsed: number;
  cloudSyncSizeQuota: number;
  templatesQuota: number;
  templatesQuotaUsed: number;
  nextQuotaResetOn: number;
  subscription: {
    provider?: 'stripe' | 'paddle';
    frequency?: Frequency;
    createdOn: number;
    renewOn: number;
    portalEnabled?: boolean;
    cancellationScheduled?: boolean;
    pastDue?: boolean;
  };
};
