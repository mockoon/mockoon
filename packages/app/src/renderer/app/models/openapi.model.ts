import { Route, RouteResponse } from '@mockoon/commons';

export type OpenApiReimportPlan = {
  environmentName: string;
  routesToAdd: Route[];
  counts: {
    newRoutes: number;
    newResponses: number;
    skippedRoutes: number;
  };
  responsesToAdd: {
    existingRouteUuid: string;
    method: string;
    endpoint: string;
    newResponses: RouteResponse[];
  }[];
};

export type OpenApiReimportPreviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; plan: OpenApiReimportPlan }
  | { status: 'error'; error: string };
