import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SettingsService, SettingsType } from 'src/app/services/settings.service';

@Component({
  selector: 'app-welcome-modal',
  templateUrl: './welcome-modal.component.html'
})
export class WelcomeModalComponent implements OnInit {
  @ViewChild('modal') modal: ElementRef;
  public settings: SettingsType;

  constructor(private modalService: NgbModal, private settingsService: SettingsService) { }

  ngOnInit() {
    // wait for settings to be ready and check if display needed
    this.settingsService.settingsReady.subscribe((ready) => {
      if (ready) {
        this.settings = this.settingsService.settings;

        if (!this.settings.welcomeShown) {
          this.settings.welcomeShown = true;
          this.settingsUpdated('welcomeShown');
          this.modalService.open(this.modal, { backdrop: 'static' }).result.then((result) => {
          }, (reason) => {
            // closing
          });
        }
      }
    });
  }

  public settingsUpdated(settingName: string) {
    this.settingsService.settingsUpdateEvents.next(this.settings);
  }
}
