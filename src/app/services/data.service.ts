import { Injectable } from '@angular/core';
import { Config } from 'app/config';
import { DataSubjectType, ExportType } from 'app/types/data.type';
import { EnvironmentsType } from 'app/types/environment.type';
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
  public wrapExport(data: EnvironmentsType, subject: DataSubjectType): string {
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
    const importMD5 = crypto.createHash('md5').update(JSON.stringify(importData.data) + Config.exportSalt).digest('hex');

    return importMD5 === importData.checksum;
  }
}
