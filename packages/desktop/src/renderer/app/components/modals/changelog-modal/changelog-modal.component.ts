import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { filter, first, map, shareReplay, tap } from 'rxjs/operators';
import { gt as semverGt } from 'semver';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { updateSettingsAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/shared/config';

@Component({
  selector: 'app-changelog-modal',
  templateUrl: './changelog-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangelogModalComponent implements OnInit, AfterViewInit {
  @ViewChild('modal')
  public modal: ElementRef;
  public appVersion = Config.appVersion;
  public changelog$: Observable<string>;
  private modalOptions: NgbModalOptions = {
    size: 'xl'
  };

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
          if (semverGt(Config.appVersion, settings.lastChangelog)) {
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
    MainAPI.send(
      'APP_OPEN_EXTERNAL_LINK',
      Config.githubTagReleaseUrl + Config.appVersion
    );
  }

  public showModal() {
    this.modalService.open(this.modal, this.modalOptions);
  }
}
