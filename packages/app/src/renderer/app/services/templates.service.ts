import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
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
  tap
} from 'rxjs';
import { DeepPartial } from 'src/renderer/app/libs/utils.lib';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { updateUserAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Injectable({ providedIn: 'root' })
export class TemplatesService {
  private httpClient = inject(HttpClient);
  private userService = inject(UserService);
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
    return this.httpClient
      .get<Template[]>(`${Config.apiURL}templates`)
      .pipe(shareReplay(1));
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
        this.httpClient
          .get<Template>(`${Config.apiURL}templates/${id}`)
          .pipe(shareReplay(1))
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

    return this.userService.getIdToken().pipe(
      switchMap((idToken) =>
        this.httpClient
          .get<{ data: string }>(`${Config.apiURL}templates/generate`, {
            params: {
              q: prompt,
              type: 'template',
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

    return this.userService.getIdToken().pipe(
      switchMap((idToken) =>
        this.httpClient
          .get<{ data: Route }>(`${Config.apiURL}templates/generate`, {
            params: {
              q: prompt,
              type: 'endpoint',
              options: options.join(',')
            },
            headers: new HttpHeaders().set('Authorization', `Bearer ${idToken}`)
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
