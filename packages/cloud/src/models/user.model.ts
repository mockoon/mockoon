import { Frequency, Plans } from './plans.model';
import { TeamRoles } from './team.model';

export type User = {
  uid: string;
  email: string;
  plan: Plans;
  teamId: string;
  teamRole: TeamRoles;
  deployInstancesQuota: number;
  deployInstancesQuotaUsed: number;
  cloudSyncItemsQuota: number;
  cloudSyncItemsQuotaUsed: number;
  cloudSyncSizeQuota: number;
  templatesQuota: number;
  templatesQuotaUsed: number;
  nextQuotaResetOn: number;
  subscription: {
    provider?: 'stripe' | 'paddle' | 'free';
    frequency?: Frequency;
    createdOn: number;
    renewOn: number;
    portalEnabled?: boolean;
    cancellationScheduled?: boolean;
    pastDue?: boolean;
    subscriptionId: string;
  };
};
