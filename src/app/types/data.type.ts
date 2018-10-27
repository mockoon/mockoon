import { EnvironmentsType, EnvironmentType } from 'src/app/types/environment.type';
import { RouteType } from 'src/app/types/route.type';

export type DataSubjectType = 'full' | 'environment' | 'route';

export type ExportType = {
  id: string;
  checksum: string;
  subject: DataSubjectType;
  data: EnvironmentsType | EnvironmentType | RouteType;
};
