import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AnalyticsEvents } from 'src/app/enums/analytics-events.enum';
import { EventsService } from 'src/app/services/events.service';
import { SettingsService, SettingsType } from 'src/app/services/settings.service';

@Component({
  selector: 'app-welcome-modal',
  templateUrl: './welcome-modal.component.html'
})
export class WelcomeModalComponent implements OnInit {
  @ViewChild('modal') modal: ElementRef;
  public settings: SettingsType;

  constructor(private modalService: NgbModal, private settingsService: SettingsService, private eventsService: EventsService) { }

  ngOnInit() {
    // wait for settings to be ready and check if display needed
    this.settingsService.settingsReady.subscribe((ready) => {
      if (ready) {
        this.settings = this.settingsService.settings;

        if (!this.settings.welcomeShown) {
          this.settings.welcomeShown = true;
          this.settingsUpdated();
          this.modalService.open(this.modal, { backdrop: 'static', centered: true }).result.then(() => {
          }, () => { });
        }
      }
    });
  }

  public settingsUpdated() {
    this.settingsService.settingsUpdateEvents.next(this.settings);
  }

  public closeModal() {
    this.modalService.dismissAll();
    this.eventsService.analyticsEvents.next(AnalyticsEvents.APPLICATION_FIRST_LOAD);
  }
}
