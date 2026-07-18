import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';

@Component({
  selector: 'app-offline-banner',
  template: `<div class="d-flex align-items-center px-3 py-2 text-warning">
    <app-svg icon="edit_off" size="14" class="me-2" />
    <small>Offline, read-only mode</small>
  </div>`,
  styleUrls: ['./offline-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SvgComponent]
})
export class OfflineBannerComponent {}
