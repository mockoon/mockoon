import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { shell } from 'electron';
import { Observable } from 'rxjs';
import { filter, first, map, shareReplay, tap } from 'rxjs/operators';
import { gt as semverGt } from 'semver';
import { Config } from 'src/app/config';
import { updateSettingsAction } from 'src/app/stores/actions';
import { Store } from 'src/app/stores/store';

@Component({
  selector: 'app-changelog-modal',
  templateUrl: './changelog-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangelogModalComponent implements OnInit, AfterViewInit {
  @ViewChild('modal', { static: false })
  public modal: ElementRef;
  public appVersion = Config.appVersion;
  public changelog$: Observable<string>;

  constructor(
    private modalService: NgbModal,
    private httpClient: HttpClient,
    private store: Store
  ) {}

  ngOnInit() {
    this.changelog$ = this.httpClient
      .get(Config.githubAPITagReleaseUrl + Config.appVersion)
      .pipe(
        map((release) => release['body']),
        shareReplay(1)
      );

    this.changelog$.subscribe();
  }

  ngAfterViewInit() {
    // show the modal after an update or for the first time
    this.store
      .select('settings')
      .pipe(
        filter((settings) => !!settings),
        first(),
        tap((settings) => {
          if (
            !settings.lastChangelog ||
            semverGt(Config.appVersion, settings.lastChangelog)
          ) {
            this.showModal();
            this.store.update(
              updateSettingsAction({ lastChangelog: Config.appVersion })
            );
          }
        })
      )
      .subscribe();
  }

  public openReleaseLink() {
    shell.openExternal(Config.githubTagReleaseUrl + Config.appVersion);
  }

  public showModal() {
    this.modalService
      .open(this.modal, { backdrop: 'static', centered: true, size: 'lg' })
      .result.then(
        () => {},
        () => {}
      );
  }
}
