import { Injectable } from '@angular/core';
import { Config } from 'src/app/config';
import { Utils } from 'src/app/libs/utils.lib';
import { DataSubjectType, ExportType } from 'src/app/types/data.type';
import { EnvironmentsType, EnvironmentType } from 'src/app/types/environment.type';
import { RouteType } from 'src/app/types/route.type';
import { EnvironmentLogType } from 'src/app/types/server.type';
import * as crypto from 'crypto';

@Injectable()
export class DataService {
  private exportId = 'mockoon_export';

  constructor() { }

  /**
   * Wrap data to export in Mockoon export format
   *
   * @param data
   * @param subject
   */
  public wrapExport(data: EnvironmentsType | EnvironmentType | RouteType, subject: DataSubjectType): string {
    return JSON.stringify(<ExportType>{
      id: this.exportId,
      checksum: crypto.createHash('md5').update(JSON.stringify(data) + Config.exportSalt).digest('hex'),
      subject,
      data
    });
  }

  /**
   * Verify the checksum of an import
   *
   * @param importData
   */
  public verifyImportChecksum(importData: ExportType): boolean {
    if (importData.id !== this.exportId) {
      return false;
    }
    const importMD5 = crypto.createHash('md5').update(JSON.stringify(importData.data) + Config.exportSalt).digest('hex');

    return importMD5 === importData.checksum;
  }

  /**
   * Format a request log
   *
   * @param request
   */
  public formatRequestLog(request: any): EnvironmentLogType {
    // use some getter to keep the scope because some request properties are be defined later by express (route, params, etc)
    const requestLog: EnvironmentLogType = {
      timestamp: new Date(),
      get route() {
        return (request.route) ? request.route.path : null;
      },
      method: request.method,
      protocol: request.protocol,
      url: request.originalUrl,
      headers: [],
      get proxied() {
        return request.proxied;
      },
      get params() {
        if (request.params) {
          return Object.keys(request.params).map((paramName) => {
            return { name: paramName, value: request.params[paramName] };
          });
        }

        return [];
      },
      get queryParams() {
        if (request.query) {
          return Object.keys(request.query).map((queryParamName) => {
            return { name: queryParamName, value: request.query[queryParamName] };
          });
        }

        return [];
      },
      get body() {
        const maxLength = 10000;
        let truncatedBody: string = request.body;

        // truncate
        if (truncatedBody.length > maxLength) {
          truncatedBody = truncatedBody.substring(0, maxLength) + '\n\n-------- BODY HAS BEEN TRUNCATED --------';
        }

        return truncatedBody;
      }
    };

    // get and sort headers
    requestLog.headers = Object.keys(request.headers).map((headerName) => {
      return { name: headerName, value: request.headers[headerName] };
    }).sort(Utils.ascSort);

    return requestLog;
  }
}
