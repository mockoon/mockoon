import { Environment } from './environment.model';
import { Route } from './route.model';

export type LegacyExport = {
  source: string;
  data: (
    | { type: 'environment'; item: Environment }
    | { type: 'route'; item: Route }
  )[];
};
