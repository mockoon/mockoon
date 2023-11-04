import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  catchError,
  distinctUntilChanged,
  map,
  of,
  shareReplay,
  switchMap,
  tap
} from 'rxjs';
import {
  Template,
  TemplateGenerateOptions,
  TemplateListItem
} from 'src/renderer/app/models/template.model';
import { Plans, User } from 'src/renderer/app/models/user.model';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { updateUserAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Injectable({ providedIn: 'root' })
export class TemplatesService {
  public generatingTemplate$ = new BehaviorSubject<
    'NONE' | 'INPROGRESS' | 'DONE'
  >('NONE');
  public lastPrompt$ = new BehaviorSubject<string>('');
  public lastGeneratedTemplate$ = new BehaviorSubject<string>('');
  private templateCache = new Map<string, Observable<Template>>();

  constructor(
    private httpClient: HttpClient,
    private userService: UserService,
    private toastsService: ToastsService,
    private store: Store
  ) {}

  public getTemplatesList(): Observable<TemplateListItem[]> {
    return this.httpClient
      .get<Template[]>(`${Config.apiURL}templates`)
      .pipe(shareReplay(1));
  }

  public getTemplateById(id: string): Observable<Template> {
    return this.store.select('user').pipe(
      distinctUntilChanged(
        (previous: User, current: User) =>
          previous === current && previous.plan === current.plan
      ),
      switchMap((user) => {
        const cacheKey =
          !user || user.plan === Plans.FREE ? `free/${id}` : `pro/${id}`;

        if (!this.templateCache.has(cacheKey)) {
          let http$: Observable<Template>;

          if (!user || user.plan === Plans.FREE) {
            http$ = this.httpClient
              .get<Template>(`${Config.apiURL}templates/free/${id}`)
              .pipe(shareReplay(1));
          } else {
            http$ = of(true).pipe(
              switchMap(() => this.userService.getIdToken()),
              switchMap((idToken) =>
                this.httpClient.get<Template>(
                  `${Config.apiURL}templates/pro/${id}`,
                  {
                    headers: new HttpHeaders().set(
                      'Authorization',
                      `Bearer ${idToken}`
                    )
                  }
                )
              ),
              shareReplay(1)
            );
          }

          this.templateCache.set(cacheKey, http$);
        }

        return this.templateCache.get(cacheKey);
      })
    );
  }

  public generateTemplate(
    prompt: string,
    options: (keyof TemplateGenerateOptions)[]
  ): Observable<string> {
    this.generatingTemplate$.next('INPROGRESS');
    this.lastPrompt$.next(prompt);

    return this.userService.getIdToken().pipe(
      switchMap((idToken) =>
        this.httpClient
          .get<{ data: string }>(`${Config.apiURL}templates/generate`, {
            params: {
              q: prompt,
              options: options.join(',')
            },
            headers: new HttpHeaders().set('Authorization', `Bearer ${idToken}`)
          })
          .pipe(
            map((response) => response.data),
            tap((template) => {
              this.generatingTemplate$.next('DONE');
              this.lastGeneratedTemplate$.next(template);

              this.store.update(
                updateUserAction({
                  templatesQuotaUsed:
                    this.store.get('user').templatesQuotaUsed + 1
                })
              );
            }),
            catchError((error) => {
              this.generatingTemplate$.next('NONE');

              this.toastsService.addToast(
                'warning',
                'Something went wrong. Please try again later or review your subscription status in your account page.'
              );

              return EMPTY;
            })
          )
      )
    );
  }
}
