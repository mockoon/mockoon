import { AsyncPipe, NgIf } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, startWith } from 'rxjs/operators';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Config } from 'src/renderer/config';
import { SpinnerComponent } from '../../spinner.component';

@Component({
  selector: 'app-changelog-modal',
  templateUrl: './changelog-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, MarkdownComponent, AsyncPipe, SpinnerComponent]
})
export class ChangelogModalComponent implements OnInit {
  private httpClient = inject(HttpClient);
  private uiService = inject(UIService);

  public appVersion = Config.appVersion;
  public changelog$: Observable<{
    error?: string;
    data?: string;
    loading: boolean;
  }>;
  public releaseUrl = `${Config.releasePublicURL}${Config.appVersion}`;

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

  public close() {
    this.uiService.closeModal('changelog');
  }
}
