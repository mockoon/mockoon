import { Pipe, PipeTransform } from '@angular/core';

/**
 * Truncate to the chosen length or 10 characters by default
 */
@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  transform(text: string, length = 10): string {
    return text.substring(0, length - 3 ) + ((text.length) ? '...' : '');
  }
}
