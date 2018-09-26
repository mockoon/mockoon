import { EnvironmentType } from 'src/app/types/environment.type';
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

        // find content type header
        const ContentTypeHeader = route.customHeaders.find(customHeader => customHeader.key === 'Content-Type');

        // add custom header only if no content type
        if (!ContentTypeHeader) {
          route.customHeaders.unshift({ uuid: uuid(), key: 'Content-Type', value: route['contentType'] });
        }

        // delete old content type
        delete route['contentType'];
      });
    }
  }
];
