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
import {
  Environment,
  Header,
  RouteResponse,
  TestHeaderValidity
} from '@mockoon/commons';
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
import {
  headerNames,
  headerValues
} from 'src/renderer/app/constants/routes.constants';
import { HeadersProperties } from 'src/renderer/app/models/common.model';

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
  public injectedHeaders$: Observable<Header[]>;
  @Output()
  public headerAdded = new EventEmitter<any>();
  @Output()
  public headersUpdated = new EventEmitter<Header[]>();
  public dataSubject$: Observable<RouteResponse | Environment>;
  public form: FormGroup;
  public testHeaderValidity = TestHeaderValidity;
  public headerNamesSearch = this.buildSearch(headerNames);
  public headerValuesSearch = this.buildSearch(headerValues);
  private listenToChanges = true;
  private destroy$ = new Subject<void>();

  public get headers() {
    return this.form.get('headers') as FormArray;
  }

  constructor(private formBuilder: FormBuilder) {}

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
    if (this.injectedHeaders$) {
      this.injectedHeaders$
        .pipe(
          filter((headers) => !!headers && headers.length > 0),
          tap((headers) => {
            this.injectHeaders(headers);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe();
    }

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
    this.headers.removeAt(headerIndex);
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
