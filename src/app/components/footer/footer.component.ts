import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { shell } from 'electron';
import { platform } from 'os';
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';
import { Config } from 'src/app/config';
import { UpdateService } from 'src/app/services/update.service';
import { Store } from 'src/app/stores/store';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent implements OnInit {
  public updateAvailable$: Observable<boolean>;
  public platform = platform();
  public appClosing$: Observable<boolean>;

  constructor(private updateService: UpdateService, private store: Store) {}

  ngOnInit() {
    this.updateAvailable$ = this.updateService.updateAvailable();
    this.appClosing$ = this.store.select('uiState').pipe(pluck('appClosing'));
  }

  /**
   * Apply the update
   */
  public applyUpdate() {
    this.updateService.applyUpdate();
  }

  /**
   * Open the repository for feedback
   */
  public openFeedbackLink() {
    shell.openExternal(Config.feedbackLink);
  }
}
