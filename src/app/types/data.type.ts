import { EnvironmentsType, EnvironmentType } from 'app/types/environment.type';
import { RouteType } from 'app/types/route.type';

export type DataSubjectType = 'full' | 'environment' | 'route';

export type ExportType = {
  id: string;
  checksum: string;
  subject: DataSubjectType;
  data: EnvironmentsType | EnvironmentType | RouteType;
};
