import { Environment, Environments, Route } from '@mockoon/commons';

export type DataSubject = 'environment' | 'route';

// Export file format prior 1.7.0
export type OldExport = {
  id: string;
  appVersion: string;
  subject: 'full' | 'environment' | 'route';
  data: Environments | Environment | Route;
};
