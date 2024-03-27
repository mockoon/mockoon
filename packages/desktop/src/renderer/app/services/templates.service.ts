import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Template,
  TemplateGenerateOptions,
  TemplateListItem
} from '@mockoon/cloud';
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
}
