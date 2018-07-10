import { EnvironmentType } from 'app/types/environment.type';
import * as uuid from 'uuid/v1';

export const Migrations: Function[] = [
  // v0.4.0beta
  (environment: EnvironmentType) => {
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
  },

  // v0.5.0beta
  (environment: EnvironmentType) => {
    environment.routes.forEach(route => {
      // add uuid
      if (!route.uuid) {
        route.uuid = uuid();
      }

      // find content type header
      const ContentTypeHeader = route.customHeaders.find(customHeader => customHeader.key === 'Content-Type');

      // add custom header only if no content type
      if (!ContentTypeHeader) {
        route.customHeaders.unshift({ uuid: uuid(), key: 'Content-Type', value: route['contentType'] })
      }

      // delete old content type
      delete route['contentType'];
    });
  }
];
