import { Environment, Environments } from 'src/app/types/environment.type';
import { Route } from 'src/app/types/route.type';

export type DataSubjectType = 'full' | 'environment' | 'route';

export type ExportType = {
  id: string;
  appVersion: string;
  checksum: string;
  subject: DataSubjectType;
  data: Environments | Environment | Route;
};
