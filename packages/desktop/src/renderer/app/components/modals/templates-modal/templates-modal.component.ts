import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { RandomInt } from '@mockoon/commons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  BehaviorSubject,
  catchError,
  concat,
  concatMap,
  debounceTime,
  delay,
  EMPTY,
  filter,
  finalize,
  from,
  map,
  merge,
  mergeMap,
  Observable,
  of,
  repeat,
  Subject,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { demoTemplates } from 'src/renderer/app/constants/demo-templates';
import { defaultEditorOptions } from 'src/renderer/app/constants/editor.constants';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { TemplatesTabsName } from 'src/renderer/app/models/store.model';
import {
  Template,
  TemplateListItem
} from 'src/renderer/app/models/template.model';
import { User } from 'src/renderer/app/models/user.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { TemplatesService } from 'src/renderer/app/services/templates.service';
import {
  setActiveTemplatesTabAction,
  updateFilterAction
} from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-templates-modal',
  templateUrl: './templates-modal.component.html',
  styleUrls: ['./templates-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fade-1', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('1s ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('fade-2', [
      state('false', style({ opacity: 0 })),
      state('true', style({ opacity: 1 })),
      transition('false=>true', [animate('1s ease-in')])
    ])
  ]
})
export class TemplatesModalComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('modal')
  public modal: ElementRef;
  public loginURL = Config.loginURL;
  public isLoading$ = new BehaviorSubject<boolean>(false);
  public isDemoLoading$ = new BehaviorSubject<boolean>(false);
  public activeTemplateListItem$ = new BehaviorSubject<TemplateListItem>(null);
  public activeTemplate$: Observable<Template>;
  public activeTemplatesTab$: Observable<TemplatesTabsName>;
  public templates$: Observable<TemplateListItem[]>;
  public templatesFilter$: Observable<string>;
  public os$: Observable<string>;
  public demo$: Observable<any>;
  public user$: Observable<User>;
  public templatesFilter = new FormControl('');
  public prompt = new FormControl('');
  public demoPrompt = new FormControl('');
  public generatedTemplateBody = new FormControl('');
  public demoGeneratedTemplateBody = new FormControl('');
  public generateOptions = this.formBuilder.group({
    json: true,
    list: true,
    templating: true
  });
  public proPlansURL = Config.proPlansURL;
  public maxTemplatePromptLength = Config.maxTemplatePromptLength;
  public toggles = [
    {
      name: 'json',
      items: [
        {
          value: 'json',
          label: 'JSON',
          tooltip: 'Generate valid JSON'
        }
      ]
    },
    {
      name: 'list',
      items: [
        {
          value: 'list',
          label: 'Array',
          tooltip: 'Generate an array of items'
        }
      ]
    },
    {
      name: 'templating',
      items: [
        {
          value: 'templating',
          label: 'templating',
          tooltip:
            "Generate dynamic content with templating helpers (e.g. {{faker 'name.firstName' }})"
        }
      ]
    }
  ];
  public defaultEditorOptions = defaultEditorOptions;
  public focusableInputs = FocusableInputs;
  public open = false;
  public demoRuns = 0;
  private isFirstDemo = true;
  private destroy$ = new Subject<void>();

  constructor(
    private modalService: NgbModal,
    private eventsService: EventsService,
    private templatesService: TemplatesService,
    private environmentsService: EnvironmentsService,
    private store: Store,
    private formBuilder: FormBuilder,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.os$ = from(MainAPI.invoke('APP_GET_OS'));
    this.user$ = this.store.select('user');
    this.activeTemplatesTab$ = this.store.select('activeTemplatesTab');
    this.activeTemplatesTab$
      .pipe(
        withLatestFrom(this.user$),
        switchMap(([tab, user]) => {
          if (tab === 'GENERATE' && (!user || user.plan === 'FREE')) {
            return this.demo$;
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

    this.templates$ = this.templatesService.getTemplatesList().pipe(
      withLatestFrom(this.user$),
      filter(([templates]) => templates && templates.length > 0),
      tap(([templates, user]) => {
        const firstFreeTemplate = templates.find(
          (template) => template.pro === false
        );

        this.setActiveTemplateListItem(
          user && user.plan !== 'FREE' ? templates[0] : firstFreeTemplate
        );
      }),
      map(([templates]) => templates),
      catchError(() => EMPTY)
    );

    this.activeTemplate$ = this.activeTemplateListItem$.pipe(
      filter((templateListItem) => templateListItem !== null),
      switchMap((templateListItem) =>
        this.templatesService.getTemplateById(templateListItem.id)
      )
    );

    // ensure that we load the templates before opening the modal
    this.templates$.subscribe();

    this.templatesFilter$ = this.store.selectFilter('templates').pipe(
      tap((search) => {
        this.templatesFilter.patchValue(search, { emitEvent: false });
      })
    );

    this.templatesFilter.valueChanges
      .pipe(
        debounceTime(10),
        tap((search) =>
          this.store.update(updateFilterAction('templates', search))
        ),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.buildDemoAnimation();
  }

  ngAfterViewInit() {
    this.eventsService.templatesModalEvents
      .pipe(
        tap(() => {
          const modal = this.modalService.open(this.modal, {
            size: 'lg'
          });
          modal.shown.subscribe(() => {
            this.open = true;

            if (!this.isLoading$.value) {
              this.eventsService.generatingTemplate$.next('NONE');
            }
          });
          merge(modal.dismissed, modal.closed).subscribe(() => {
            this.open = false;

            if (this.isLoading$.value) {
              this.eventsService.generatingTemplate$.next('INPROGRESS');
            } else {
              this.resetAnimation();
            }

            this.resetAnimation();
          });
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public generate() {
    if (!this.prompt.value || this.isLoading$.value === true) {
      return;
    }

    this.isLoading$.next(true);

    this.templatesService
      .generateTemplate(
        this.prompt.value,
        this.toggles.reduce((options, toggle) => {
          if (this.generateOptions.get(toggle.name).value === true) {
            options.push(toggle.name);
          }

          return options;
        }, [])
      )
      .pipe(
        tap((templateContent) => {
          this.generatedTemplateBody.setValue(templateContent);
        }),
        finalize(() => {
          this.isLoading$.next(false);
          if (!this.open) {
            this.eventsService.generatingTemplate$.next('DONE');
          } else {
            this.eventsService.generatingTemplate$.next('NONE');
          }
        })
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
    let options: Parameters<EnvironmentsService['addCRUDRoute']>[2];

    if (activeTemplateTab === 'LIST') {
      options = {
        endpoint: activeTemplate.slug,
        dataBucket: {
          name: activeTemplate.name,
          value: activeTemplate.content
        }
      };
    } else if (activeTemplateTab === 'GENERATE') {
      const slugPrompt = this.prompt.value.replace(/\s/g, '-').toLowerCase();

      options = {
        endpoint: slugPrompt,
        dataBucket: {
          name: this.prompt.value,
          value: this.generatedTemplateBody.value
        }
      };
    }

    this.environmentsService.addCRUDRoute('root', true, options);
    this.modalService.dismissAll();
  }

  public createGetRoute(
    activeTemplateTab: TemplatesTabsName,
    activeTemplate: Template
  ) {
    let options: Parameters<EnvironmentsService['addHTTPRoute']>[2];

    if (activeTemplateTab === 'LIST') {
      options = {
        endpoint: activeTemplate.slug,
        body: activeTemplate.content
      };
    } else if (activeTemplateTab === 'GENERATE') {
      options = {
        endpoint: this.prompt.value.replace(/\s/g, '-').toLowerCase(),
        body: this.generatedTemplateBody.value
      };
    }
    this.environmentsService.addHTTPRoute('root', true, options);
    this.modalService.dismissAll();
  }

  /**
   * Clear the databucket filter
   */
  public clearFilter() {
    this.store.update(updateFilterAction('templates', ''));
  }

  private resetAnimationFields() {
    this.demoPrompt.setValue('');
    this.demoGeneratedTemplateBody.setValue('');
  }

  private resetAnimation() {
    this.resetAnimationFields();
    this.isDemoLoading$.next(false);
    this.demoRuns = 0;
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
            this.demoRuns++;
            this.demoGeneratedTemplateBody.setValue(items[index].value);
            this.isFirstDemo = false;
            index++;
            if (index === demoTemplates.length) {
              index = 0;
            }
          }),
          delay(2000)
        )
      );

    this.demo$ = of(true).pipe(
      mergeMap(() => createAnimation(demoTemplates)),
      repeat(),
      takeUntil(this.destroy$)
    );
  }
}
