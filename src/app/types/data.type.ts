import { EnvironmentsType } from 'app/types/environment.type';

export type DataSubjectType = 'full' | 'environment' | 'route';

export type ExportType = {
  id: string;
  checksum: string;
  subject: DataSubjectType;
  data: EnvironmentsType;
};
