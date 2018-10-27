import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Config } from 'src/app/config';
import { EventsService } from 'src/app/services/events.service';
const appVersion = require('../../../package.json').version;

@Component({
  selector: 'app-changelog-modal',
  templateUrl: './changelog-modal.component.html'
})
export class ChangelogModalComponent implements OnInit {
  @ViewChild('modal') modal: ElementRef;
  @Output() closed: EventEmitter<any> = new EventEmitter();
  public appVersion = appVersion;
  public releaseChangelog: string;

  constructor(private modalService: NgbModal, private eventsService: EventsService, private httpClient: HttpClient) {
    this.httpClient.get(Config.githubAPITagReleaseUrl + appVersion).subscribe((release) => {
      this.releaseChangelog = release['body'];
    });
  }

  ngOnInit() {
    this.eventsService.changelogModalEvents.subscribe(() => {
      this.modalService.open(this.modal, { backdrop: 'static', centered: true }).result.then(() => {
        this.closed.emit();
      }, () => { });
    });
  }
}
