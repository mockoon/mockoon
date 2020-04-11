import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, distinctUntilKeyChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { TestHeaderValidity } from 'src/app/libs/utils.lib';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { EventsService } from 'src/app/services/events.service';
import { Environment } from 'src/app/types/environment.type';
import { Header, headerNames, headerValues, RouteResponse } from 'src/app/types/route.type';

export type HeadersListType = 'routeResponseHeaders' | 'environmentHeaders';

@Component({
  selector: 'app-headers-list',
  templateUrl: 'headers-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeadersListComponent implements OnInit, OnDestroy {
  @Input() activeItem$: Observable<Environment | RouteResponse>;
  @Input() type: HeadersListType;
  @Input() headers: 'headers' | 'proxyReqHeaders' | 'proxyResHeaders' =
    'headers';
  @Output() headerAdded: EventEmitter<any> = new EventEmitter();
  public headers$: Observable<Header[]>;
  public form: FormGroup;
  public headersFormChanges: Subscription;
  public testHeaderValidity = TestHeaderValidity;
  private listenToChanges = true;
  private destroy$ = new Subject<void>();

  constructor(
    private environmentsService: EnvironmentsService,
    private formBuilder: FormBuilder,
    private eventsService: EventsService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      headers: this.formBuilder.array([])
    });

    // observe initial state of the activeItem
    this.headers$ = this.activeItem$.pipe(
      filter((data) => !!data),
      distinctUntilKeyChanged('uuid'),
      map((activeItem) => activeItem.headers),
      tap((headers) => {
        this.replaceHeaders(headers, false);
      })
    );

    // subscribe to header injection event
    this.eventsService.injectHeaders
      .pipe(
        filter((data) => data.target === this.type),
        map((data) => data[this.headers] || []),
        tap((headers) => {
          this.injectHeaders(headers);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // subscribe to changes and send new headers values to the store
    this.form
      .get('headers')
      .valueChanges.pipe(
        filter(() => this.listenToChanges),
        debounceTime(100),
        map((newHeaders) => ({ [this.headers]: newHeaders })),
        tap((newProperty) => {
          if (this.type === 'environmentHeaders') {
            this.environmentsService.updateActiveEnvironment(newProperty);
          } else if (this.type === 'routeResponseHeaders') {
            this.environmentsService.updateActiveRouteResponse(newProperty);
          }
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
   * Replace existing header with injected header value, or append injected header
   */
  private injectHeaders(headers: Header[]) {
    const newHeaders = [...this.form.value.headers];

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
    const formHeadersArray = this.form.get('headers') as FormArray;

    formHeadersArray.clear();

    newHeaders.forEach((header) => {
      formHeadersArray.push(
        this.formBuilder.group({
          key: header.key,
          value: header.value
        })
      );
    });

    this.changeDetectorRef.markForCheck();

    this.listenToChanges = true;
  }

  /**
   * Return observable for the typeahead directive
   */
  public search(listName: 'headerNames' | 'headerValues') {
    let list: string[];
    if (listName === 'headerNames') {
      list = headerNames;
    } else if (listName === 'headerValues') {
      list = headerValues;
    }

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
   * Add a new header to the list if possible
   */
  public addHeader() {
    (this.form.get('headers') as FormArray).push(
      this.formBuilder.group({ key: '', value: '' })
    );

    this.headerAdded.emit();
  }

  /**
   * Remove a header from the list
   *
   * @param headerIndex
   */
  public removeHeader(headerIndex: number) {
    (this.form.get('headers') as FormArray).removeAt(headerIndex);
  }
}
