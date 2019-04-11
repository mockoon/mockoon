import { EnvironmentType } from 'src/app/types/environment.type';
import { RouteType } from 'src/app/types/route.type';

export const Utils: { [key: string]: any } = {
  ascSort: (a, b) => {
    if (a.name < b.name) {
      return -1;
    } else {
      return 1;
    }
  },
  objectContainsOneArrayItem: (obj: { [key: string]: string }, arr: string[]) => {
    if (obj && arr) {
      return !!Object.keys(obj).find(key => arr.includes(key));
    }
    return false;
  },
  getRouteContentType: (environment: EnvironmentType, route: RouteType) => {
    const routeContentType = route.headers.find(header => header.key === 'Content-Type');

    if (routeContentType && routeContentType.value) {
      return routeContentType.value;
    }

    const environmentContentType = environment.headers.find(header => header.key === 'Content-Type');

    if (environmentContentType && environmentContentType.value) {
      return environmentContentType.value;
    }

    return '';
  }
};
