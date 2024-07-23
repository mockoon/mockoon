import { animate, style, transition, trigger } from '@angular/animations';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormControl, UntypedFormControl } from '@angular/forms';
import { Template, TemplateListItem, User } from '@mockoon/cloud';
import {
  BuildHTTPRoute,
  RandomInt,
  Route,
  RouteResponse
} from '@mockoon/commons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  Subject,
  catchError,
  combineLatestWith,
  concat,
  concatMap,
  delay,
  filter,
  from,
  map,
  merge,
  mergeMap,
  of,
  repeat,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { demoTemplates } from 'src/renderer/app/constants/demo-templates';
import { defaultEditorOptions } from 'src/renderer/app/constants/editor.constants';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { textFilter } from 'src/renderer/app/libs/utils.lib';
import { TemplatesTabsName } from 'src/renderer/app/models/store.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { TemplatesService } from 'src/renderer/app/services/templates.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { setActiveTemplatesTabAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-templates-modal',
  templateUrl: './templates-modal.component.html',
  styleUrls: ['./templates-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('1s ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class TemplatesModalComponent implements OnInit, OnDestroy {
  public isDemoLoading$ = new BehaviorSubject<boolean>(false);
  public activeTemplateListItem$ = new BehaviorSubject<TemplateListItem>(null);
  public activeTemplate$: Observable<Template>;
  public activeTemplatesTab$: Observable<TemplatesTabsName>;
  public templates$: Observable<TemplateListItem[]>;
  public templatesFilter$: Observable<string>;
  public demo$: Observable<any>;
  public user$: Observable<User>;
  public lastGeneratedEndpoint$ = this.templatesService.lastGeneratedEndpoint$;
  public generatingTemplate$ = this.templatesService.generatingTemplate$;
  public generatingEndpoint$ = this.templatesService.generatingEndpoint$;
  public templatesFilter = new UntypedFormControl('');
  public promptTemplate = new UntypedFormControl('');
  public promptEndpoint = new UntypedFormControl('');
  public templatingToggle = new FormControl<boolean>(true);
  public demoPrompt = new UntypedFormControl('');
  public generatedTemplateBody = new UntypedFormControl('');
  public demoEndpoint$ = new BehaviorSubject<(typeof demoTemplates)[0]>(null);
  public cloudPlansURL = Config.cloudPlansURL;
  public maxPromptLength = Config.maxPromptLength;
  public defaultEditorOptions = defaultEditorOptions;
  public focusableInputs = FocusableInputs;
  public open = false;
  private isFirstDemo = true;
  private destroy$ = new Subject<void>();

  constructor(
    private modalService: NgbModal,
    private templatesService: TemplatesService,
    private environmentsService: EnvironmentsService,
    private store: Store,
    private uiService: UIService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.user$ = this.store.select('user');
    this.activeTemplatesTab$ = this.store.select('activeTemplatesTab');
    this.activeTemplatesTab$
      .pipe(
        withLatestFrom(this.user$),
        switchMap(([tab, user]) => {
          if (tab === 'GENERATE_TEMPLATE' && (!user || user.plan === 'FREE')) {
            return this.buildDemoAnimation();
          } else {
            return of(true).pipe(
              tap(() => {
                this.resetAnimation();
              })
            );
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    const modal = this.uiService.getModalInstance('templates');

    merge(
      modal.shown.pipe(
        tap(() => {
          if (this.templatesService.generatingTemplate$.value === 'DONE') {
            this.templatesService.generatingTemplate$.next('NONE');
          }

          if (this.templatesService.generatingEndpoint$.value === 'DONE') {
            this.templatesService.generatingEndpoint$.next('NONE');
          }
        })
      ),
      modal.hidden.pipe(
        tap(() => {
          if (this.templatesService.generatingTemplate$.value === 'DONE') {
            this.templatesService.generatingTemplate$.next('NONE');
          }

          if (this.templatesService.generatingEndpoint$.value === 'DONE') {
            this.templatesService.generatingEndpoint$.next('NONE');
          }
          this.resetAnimation();
        })
      )
    ).subscribe();

    this.templatesFilter$ = this.store.selectFilter('templates');

    this.templates$ = this.templatesService.getTemplatesList().pipe(
      filter((templates) => templates && templates.length > 0),
      combineLatestWith(this.templatesFilter$),
      tap(([templates]) => {
        this.setActiveTemplateListItem(templates[0]);
      }),
      map(([templates, search]) =>
        !search
          ? templates
          : templates.filter((template) => textFilter(template.name, search))
      ),
      catchError(() => EMPTY)
    );

    this.activeTemplate$ = this.activeTemplateListItem$.pipe(
      filter((templateListItem) => templateListItem !== null),
      switchMap((templateListItem) =>
        this.templatesService.getTemplateById(templateListItem.id)
      )
    );

    // set back the prompt/template if we open/close the modal during a generation
    this.promptTemplate.setValue(
      this.templatesService.lastTemplatePrompt$.value
    );
    this.promptEndpoint.setValue(
      this.templatesService.lastEndpointPrompt$.value
    );
    this.templatesService.lastGeneratedTemplate$
      .pipe(
        tap((template) => {
          this.generatedTemplateBody.setValue(template);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public generateTemplate() {
    if (
      !this.promptTemplate.value ||
      this.templatesService.generatingTemplate$.value === 'INPROGRESS'
    ) {
      return;
    }

    this.templatesService
      .generateTemplate(
        this.promptTemplate.value,
        this.templatingToggle.value ? ['templating'] : []
      )
      .subscribe();
  }

  public generateEndpoint() {
    if (
      !this.promptEndpoint.value ||
      this.templatesService.generatingEndpoint$.value === 'INPROGRESS'
    ) {
      return;
    }

    this.templatesService
      .generateEndpoint(
        this.promptEndpoint.value,
        this.templatingToggle.value ? ['templating'] : []
      )
      .subscribe();
  }

  /**
   * Open the account page in the default browser
   */
  public account() {
    MainAPI.send('APP_OPEN_EXTERNAL_LINK', Config.accountURL);
  }

  public setActiveTab(tab: TemplatesTabsName) {
    this.store.update(setActiveTemplatesTabAction(tab));

    if (tab === 'LIST') {
      this.resetAnimation();
    }
  }

  public setActiveTemplateListItem(templateListItem: TemplateListItem) {
    this.activeTemplateListItem$.next(templateListItem);
  }

  public createCRUDRoute(
    activeTemplateTab: TemplatesTabsName,
    activeTemplate: Template
  ) {
    let options: Parameters<EnvironmentsService['addCRUDRoute']>[1];

    if (activeTemplateTab === 'LIST') {
      options = {
        endpoint: activeTemplate.slug,
        dataBucket: {
          name: activeTemplate.name,
          value: activeTemplate.content
        }
      };
    } else if (activeTemplateTab === 'GENERATE_TEMPLATE') {
      const slugPrompt = this.promptTemplate.value
        .replace(/\s/g, '-')
        .toLowerCase();

      options = {
        endpoint: slugPrompt,
        dataBucket: {
          name: this.templatesService.lastTemplatePrompt$.value,
          value: this.templatesService.lastGeneratedTemplate$.value
        }
      };
    }

    this.environmentsService.addCRUDRoute('root', options);
    this.modalService.dismissAll();
  }

  public createGetRoute(
    activeTemplateTab: TemplatesTabsName,
    activeTemplate: Template
  ) {
    let options: Parameters<typeof BuildHTTPRoute>[1];

    if (activeTemplateTab === 'LIST') {
      options = {
        endpoint: activeTemplate.slug,
        body: activeTemplate.content
      };
    } else if (activeTemplateTab === 'GENERATE_TEMPLATE') {
      options = {
        endpoint: this.promptTemplate.value.replace(/\s/g, '-').toLowerCase(),
        body: this.templatesService.lastGeneratedTemplate$.value
      };
    }
    this.environmentsService.addHTTPRoute(
      'root',
      BuildHTTPRoute(true, options)
    );
    this.modalService.dismissAll();
  }

  public createEndpoint() {
    let newRoute: Route = BuildHTTPRoute(true);
    newRoute = {
      ...newRoute,
      ...this.templatesService.lastGeneratedEndpoint$.value,
      responses: [
        {
          ...newRoute.responses[0],
          ...this.templatesService.lastGeneratedEndpoint$.value.responses[0]
        } as RouteResponse
      ]
    };
    this.environmentsService.addHTTPRoute('root', newRoute);
    this.modalService.dismissAll();
  }

  public close() {
    this.uiService.closeModal('templates');
  }

  private resetAnimationFields() {
    this.demoPrompt.setValue('');
    this.demoEndpoint$.next(null);
  }

  private resetAnimation() {
    this.resetAnimationFields();
    this.isDemoLoading$.next(false);
    this.isFirstDemo = true;
  }

  private buildDemoAnimation() {
    this.resetAnimation();
    let index = 0;

    const createAnimation = (items: typeof demoTemplates) =>
      concat(
        of('go').pipe(
          tap(() => {
            this.resetAnimationFields();
          }),
          switchMap(() => of('go').pipe(delay(this.isFirstDemo ? 1000 : 0)))
        ),
        from(items[index].prompt.split('')).pipe(
          concatMap((letter) =>
            of(letter).pipe(
              delay(RandomInt(50, 100)),
              tap(() => {
                this.demoPrompt.setValue(this.demoPrompt.value + letter);
              })
            )
          )
        ),
        of('go').pipe(
          tap(() => {
            this.document
              .getElementById('demoGenerateButton')
              ?.classList.add('active');
          }),
          delay(500),
          tap(() => {
            this.document
              .getElementById('demoGenerateButton')
              ?.classList.remove('active');
            this.isDemoLoading$.next(true);
          }),
          delay(1000),
          tap(() => {
            this.isDemoLoading$.next(false);
            this.demoEndpoint$.next(items[index]);
            this.isFirstDemo = false;
            index++;
            if (index === demoTemplates.length) {
              index = 0;
            }
          }),
          delay(2000)
        )
      );

    return of(true).pipe(
      mergeMap(() => createAnimation(demoTemplates)),
      repeat(),
      takeUntil(this.destroy$)
    );
  }
}
