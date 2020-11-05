import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import { headerNames, headerValues } from 'src/app/constants/routes.constants';
import { HeadersProperties } from 'src/app/models/common.model';

@Component({
  selector: 'app-headers-list',
  templateUrl: 'headers-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeadersListComponent implements OnInit, OnDestroy {
  @Input()
  public dataSubject$: Observable<RouteResponse | Environment>;
  @Input()
  public headersPropertyName: HeadersProperties;
  @Input()
  public injectedHeaders$: Observable<Header[]>;
  @Output()
  public headerAdded = new EventEmitter<any>();
  @Output()
  public headersUpdated = new EventEmitter<Header[]>();
  public form: FormGroup;
  public testHeaderValidity = TestHeaderValidity;
  private listenToChanges = true;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      headers: this.formBuilder.array([])
    });

    // initialize the form depending on the env/route response headers
    this.dataSubject$
      .pipe(
        filter((uuid) => !!uuid),
        distinctUntilKeyChanged('uuid'),
        tap((dataSubject) => {
          this.replaceHeaders(dataSubject[this.headersPropertyName], false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

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
    this.form
      .get('headers')
      .valueChanges.pipe(
        filter(() => this.listenToChanges),
        tap((newHeaders) => {
          this.headersUpdated.emit(newHeaders);
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
   * Add a new header to the list
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
}
