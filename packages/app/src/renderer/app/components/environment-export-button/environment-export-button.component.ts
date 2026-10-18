import { Component, inject, input } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { EnvironmentSourceService } from 'src/renderer/app/services/environment-source.service';

@Component({
  selector: 'app-environment-export-button',
  templateUrl: './environment-export-button.component.html',
  imports: [NgbTooltip, SvgComponent]
})
export class EnvironmentExportButtonComponent {
  private environmentSourceService = inject(EnvironmentSourceService);
  public environmentUuid = input<string | null>(null);

  /**
   * Export the environment JSON to a file
   */
  public export() {
    this.environmentSourceService
      .exportEnvironmentForSource(this.environmentUuid())
      .subscribe();
  }
}
