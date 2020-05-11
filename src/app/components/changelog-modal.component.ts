import { HttpClient } from '@angular/common/http';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { shell } from 'electron';
import { Config } from 'src/app/config';
import { EventsService } from 'src/app/services/events.service';

@Component({
  selector: 'app-changelog-modal',
  templateUrl: './changelog-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangelogModalComponent implements OnInit, AfterViewInit {
  @ViewChild('modal', { static: false }) modal: ElementRef;
  public appVersion = Config.appVersion;
  public releaseChangelog: string;

  constructor(
    private modalService: NgbModal,
    private eventsService: EventsService,
    private httpClient: HttpClient
  ) {
    this.httpClient
      .get(Config.githubAPITagReleaseUrl + Config.appVersion)
      .subscribe((release) => {
        this.releaseChangelog = release['body'];
      });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.eventsService.changelogModalEvents.subscribe(() => {
      this.modalService
        .open(this.modal, { backdrop: 'static', centered: true })
        .result.then(
          () => {},
          () => {}
        );
    });
  }

  public openReleaseLink() {
    shell.openExternal(Config.githubTagReleaseUrl + Config.appVersion);
  }
}
