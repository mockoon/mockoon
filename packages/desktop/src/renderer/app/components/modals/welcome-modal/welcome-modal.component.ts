import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { filter, first } from 'rxjs/operators';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { Store } from 'src/renderer/app/stores/store';
import { Settings } from 'src/shared/models/settings.model';

@Component({
  selector: 'app-welcome-modal',
  templateUrl: './welcome-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WelcomeModalComponent implements OnInit, AfterViewInit {
  @ViewChild('modal')
  public modal: ElementRef;
  public settings$: Observable<Settings>;

  constructor(
    private modalService: NgbModal,
    private settingsService: SettingsService,
    private store: Store
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.settings$ = this.store.select('settings');

    // wait for settings to be ready and check if display needed
    this.settings$
      .pipe(filter<Settings>(Boolean), first())
      .subscribe((settings) => {
        if (!settings.welcomeShown) {
          this.modalService.open(this.modal);
        }
      });
  }

  public closeModal() {
    this.modalService.dismissAll();
    this.settingsService.updateSettings({ welcomeShown: true });
  }
}
