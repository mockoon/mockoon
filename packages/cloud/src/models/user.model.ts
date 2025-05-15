import { Frequency, Plans } from './plans.model';
import { TeamRoles } from './team.model';

export type UserProfile = {
  displayName?: string;
};

export type User = {
  uid: string;
  email: string;
  plan: Plans;
  teamId: string;
  teamRole: TeamRoles;
  deployInstancesQuota: number;
  deployInstancesQuotaUsed: number;
  deployInstancesMonthlyRequestsQuota: number;
  cloudSyncItemsQuota: number;
  cloudSyncItemsQuotaUsed: number;
  cloudSyncSizeQuota: number;
  cloudSyncHighestMajorVersion: number | null;
  templatesQuota: number;
  templatesQuotaUsed: number;
  mfa: { enabled: boolean; uid: string };
  nextQuotaResetOn: number;
  subscription: {
    trial?: boolean;
    provider?: 'stripe' | 'paddle' | 'free' | 'manual';
    frequency?: Frequency;
    createdOn: number;
    renewOn: number;
    portalEnabled?: boolean;
    cancellationScheduled?: boolean;
    pastDue?: boolean;
    subscriptionId: string;
  };
} & UserProfile;
