import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, startWith } from 'rxjs/operators';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-changelog-modal',
  templateUrl: './changelog-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangelogModalComponent implements OnInit {
  public appVersion = Config.appVersion;
  public changelog$: Observable<{
    error?: string;
    data?: string;
    loading: boolean;
  }>;

  constructor(
    private httpClient: HttpClient,
    private uiService: UIService
  ) {}

  ngOnInit() {
    this.changelog$ = this.httpClient
      .get(`${Config.changelogMarkdownURL}${Config.appVersion}.md`, {
        responseType: 'text',
        headers: new HttpHeaders({
          pragma: 'no-cache',
          'cache-control': 'no-cache'
        })
      })
      .pipe(
        shareReplay(1),
        // strip front matter from the release markdown
        map((content) => ({
          data: content.replace(/^---(.|\n|\r)*?---/, ''),
          loading: false
        })),
        catchError((error) => of({ error, loading: false })),
        startWith({ error: null, loading: true })
      );
  }

  public openReleaseLink() {
    MainAPI.send(
      'APP_OPEN_EXTERNAL_LINK',
      `${Config.releasePublicURL}${Config.appVersion}`
    );
  }

  public close() {
    this.uiService.closeModal('changelog');
  }
}
