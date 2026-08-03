import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import {
  Template,
  TemplateGenerateOptions,
  TemplateListItem
} from '@mockoon/cloud';
import { Route } from '@mockoon/commons';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  catchError,
  map,
  shareReplay,
  switchMap,
  tap,
  withLatestFrom
} from 'rxjs';
import { DeepPartial } from 'src/renderer/app/libs/utils.lib';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { updateUserAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

@Service()
export class TemplatesService {
  private httpClient = inject(HttpClient);
  private userService = inject(UserService);
  private settingsService = inject(SettingsService);
  private toastsService = inject(ToastsService);
  private store = inject(Store);

  public generatingTemplate$ = new BehaviorSubject<
    'NONE' | 'INPROGRESS' | 'DONE'
  >('NONE');
  public generatingEndpoint$ = new BehaviorSubject<
    'NONE' | 'INPROGRESS' | 'DONE'
  >('NONE');
  public lastTemplatePrompt$ = new BehaviorSubject<string>('');
  public lastEndpointPrompt$ = new BehaviorSubject<string>('');
  public lastGeneratedTemplate$ = new BehaviorSubject<string>('');
  public lastGeneratedEndpoint$ = new BehaviorSubject<DeepPartial<Route>>(null);
  private templateCache = new Map<string, Observable<Template>>();

  /**
   * Get the list of available templates
   */
  public getTemplatesList(): Observable<TemplateListItem[]> {
    return this.settingsService.selectApiUrl().pipe(
      switchMap((apiUrl) =>
        this.httpClient.get<Template[]>(`${apiUrl}templates`)
      ),
      shareReplay(1)
    );
  }

  /**
   * Get a template by its id
   *
   * @param id
   */
  public getTemplateById(id: string): Observable<Template> {
    const cacheKey = id;

    if (!this.templateCache.has(cacheKey)) {
      this.templateCache.set(
        cacheKey,
        this.settingsService.selectApiUrl().pipe(
          switchMap((apiUrl) =>
            this.httpClient.get<Template>(`${apiUrl}templates/${id}`)
          ),
          shareReplay(1)
        )
      );
    }

    return this.templateCache.get(cacheKey);
  }

  /**
   * Generate a template from a prompt
   *
   * @param prompt
   * @param options
   */
  public generateTemplate(
    prompt: string,
    options: TemplateGenerateOptions
  ): Observable<string> {
    this.generatingTemplate$.next('INPROGRESS');
    this.lastTemplatePrompt$.next(prompt);

    return this.userService.getToken().pipe(
      withLatestFrom(this.settingsService.selectApiUrl()),
      switchMap(([token, apiUrl]) =>
        this.httpClient
          .get<{ data: string }>(`${apiUrl}templates/generate`, {
            params: {
              q: prompt,
              type: 'template',
              options: options.join(',')
            },
            headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
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
            catchError(() => {
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

  /**
   * Generate an endpoint from a prompt
   *
   * @param prompt
   */
  public generateEndpoint(
    prompt: string,
    options: TemplateGenerateOptions
  ): Observable<DeepPartial<Route>> {
    this.generatingEndpoint$.next('INPROGRESS');
    this.lastEndpointPrompt$.next(prompt);

    return this.userService.getToken().pipe(
      withLatestFrom(this.settingsService.selectApiUrl()),
      switchMap(([token, apiUrl]) =>
        this.httpClient
          .get<{ data: Route }>(`${apiUrl}templates/generate`, {
            params: {
              q: prompt,
              type: 'endpoint',
              options: options.join(',')
            },
            headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
          })
          .pipe(
            map((response) => response.data),
            tap((endpoint) => {
              this.generatingEndpoint$.next('DONE');
              this.lastGeneratedEndpoint$.next(endpoint);

              this.store.update(
                updateUserAction({
                  templatesQuotaUsed:
                    this.store.get('user').templatesQuotaUsed + 1
                })
              );
            }),
            catchError(() => {
              this.generatingEndpoint$.next('NONE');

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
