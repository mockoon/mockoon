import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Environment, Header, RouteResponse } from '@mockoon/commons';
import { Observable, Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
  takeUntil,
  tap
} from 'rxjs/operators';
import { TimedBoolean } from 'src/renderer/app/classes/timed-boolean';
import {
  headerNames,
  headerValues
} from 'src/renderer/app/constants/routes.constants';
import { HeadersProperties } from 'src/renderer/app/models/common.model';
import { DataSubject } from 'src/renderer/app/models/data.model';
import { EventsService } from 'src/renderer/app/services/events.service';

@Component({
  selector: 'app-headers-list',
  templateUrl: 'headers-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeadersListComponent implements OnInit, OnDestroy {
  @Input()
  public activeDataSubject$: Observable<RouteResponse | Environment>;
  @Input()
  public headersPropertyName: HeadersProperties;
  @Input()
  public secondaryButton: string;
  @Output()
  public headerAdded = new EventEmitter<any>();
  @Input()
  public dataSubject: DataSubject;
  @Output()
  public headersUpdated = new EventEmitter<Header[]>();
  @Output()
  public secondaryButtonClicked = new EventEmitter();
  public dataSubject$: Observable<RouteResponse | Environment>;
  public form: FormGroup;
  public headerNamesSearch = this.buildSearch(headerNames);
  public headerValuesSearch = this.buildSearch(headerValues);
  public deleteHeaderRequested$ = new TimedBoolean();
  private listenToChanges = true;
  private destroy$ = new Subject<void>();

  public get headers() {
    return this.form.get('headers') as FormArray;
  }

  constructor(
    private formBuilder: FormBuilder,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      headers: this.formBuilder.array([])
    });

    // initialize the form depending on the env/route response headers
    this.dataSubject$ = this.activeDataSubject$.pipe(
      filter((dataSubject) => !!dataSubject),
      distinctUntilKeyChanged('uuid'),
      tap((dataSubject) => {
        this.replaceHeaders(dataSubject[this.headersPropertyName], false);
      })
    );

    // subscribe to header injection observable
    this.eventsService.injectHeaders$
      .pipe(
        filter(
          (injectedPayload) => injectedPayload.dataSubject === this.dataSubject
        ),
        tap((injectedPayload) => {
          this.injectHeaders(injectedPayload.headers);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // subscribe to changes and send new headers values to the store
    this.form.valueChanges
      .pipe(
        filter(() => this.listenToChanges),
        tap((formValue) => {
          this.headersUpdated.emit(formValue.headers);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  /**
   * Return contextualized observables for the typeahead directive
   *
   * @param list
   */
  public buildSearch(list: string[]) {
    return (text$: Observable<string>) =>
      text$.pipe(
        debounceTime(100),
        distinctUntilChanged(),
        map((term) =>
          term.length < 1
            ? []
            : list
                .filter((v) => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
                .slice(0, 10)
        )
      );
  }

  /**
   * Add a new header to the list
   */
  public addHeader() {
    this.headers.push(this.formBuilder.group({ key: '', value: '' }));

    this.headerAdded.emit();
  }

  /**
   * Remove a header from the list
   *
   * @param headerIndex
   */
  public removeHeader(headerIndex: number) {
    const confirmValue = this.deleteHeaderRequested$.readValue(headerIndex);

    if (confirmValue.enabled && headerIndex === confirmValue.payload) {
      this.headers.removeAt(headerIndex);
    }
  }

  /**
   * Replace existing header with injected header value, or append injected header
   */
  private injectHeaders(headers: Header[]) {
    const newHeaders = [...this.headers.value];

    headers.forEach((header) => {
      const headerExistsIndex = newHeaders.findIndex(
        (newHeader) => newHeader.key === header.key
      );

      if (headerExistsIndex > -1 && !newHeaders[headerExistsIndex].value) {
        newHeaders[headerExistsIndex] = { ...header };
      } else if (headerExistsIndex === -1) {
        newHeaders.push({ ...header });
      }
    });

    this.replaceHeaders(newHeaders);
  }

  /**
   * Replace all headers in the FormArray
   */
  private replaceHeaders(newHeaders: Header[], listenToChanges = true) {
    this.listenToChanges = listenToChanges;

    this.headers.clear();

    newHeaders.forEach((header) => {
      this.headers.push(this.formBuilder.group({ ...header }));
    });

    this.listenToChanges = true;
  }
}
