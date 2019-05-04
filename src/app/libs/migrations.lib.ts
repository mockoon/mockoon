import { EnvironmentType } from 'src/app/types/environment.type';
import { RouteType } from 'src/app/types/route.type';
import * as uuid from 'uuid/v1';

export const Migrations: { id: number, migrationFunction: (environment: EnvironmentType) => void }[] = [
  // v0.4.0beta
  {
    id: 1,
    migrationFunction: (environment: EnvironmentType) => {
      // proxy settings
      if (!environment.proxyMode) {
        environment.proxyMode = false;
      }
      if (!environment.proxyHost) {
        environment.proxyHost = '';
      }
      if (!environment.https) {
        environment.https = false;
      }
    }
  },

  // 1.0.0
  {
    id: 2,
    migrationFunction: (environment: EnvironmentType) => {
      if (!environment.cors) {
        environment.cors = true;
      }

      environment.routes.forEach(route => {
        // add uuid
        if (!route.uuid) {
          route.uuid = uuid();
        }

        if (route['customHeaders']) {
          // find content type header
          const ContentTypeHeader = route['customHeaders'].find(customHeader => customHeader.key === 'Content-Type');

          // add custom header only if no content type
          if (!ContentTypeHeader) {
            route['customHeaders'].unshift({ uuid: uuid(), key: 'Content-Type', value: route['contentType'] });
          }

          // delete old content type
          delete route['contentType'];
        }
      });
    }
  },

  // 1.2.0
  {
    id: 3,
    migrationFunction: (environment: EnvironmentType) => {
      environment.routes.forEach(route => {
        // add missing uuid
        if (!route.uuid) {
          route.uuid = uuid();
        }
      });
    }
  },

  // 1.3.0
  {
    id: 4,
    migrationFunction: (environment: EnvironmentType) => {
      // add new headers property to environments
      if (!environment.headers) {
        (environment.headers as any) = [{ uuid: uuid(), key: '', value: '' }];
      }

      environment.routes.forEach((route: RouteType & { file: any }) => {
        // add missing sendAsBody
        if (route.file && route.file.sendAsBody === undefined) {
          route.file.sendAsBody = false;
        }

        // add missing documentation
        if (route.documentation === undefined) {
          route.documentation = '';
        }

        // rename customHeaders to headers
        if (route['customHeaders']) {
          route.headers = route['customHeaders'];
          delete route['customHeaders'];
        }
      });
    }
  },

  // 1.4.0
  {
    id: 5,
    migrationFunction: (environment: EnvironmentType) => {
      delete environment['duplicates'];

      environment.routes.forEach((route: RouteType & { file: any }) => {
        // remove file object
        route.filePath = (route.file) ? route.file.path : '';
        route.sendFileAsBody = (route.file) ? route.file.sendAsBody : false;
        delete route.file;

        delete route['duplicates'];
      });
    }
  }
];
