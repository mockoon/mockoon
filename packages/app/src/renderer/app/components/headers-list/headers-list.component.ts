import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup
} from '@angular/forms';
import { Callback, Environment, Header, RouteResponse } from '@mockoon/commons';
import { NgbTooltip, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  tap
} from 'rxjs/operators';
import { TimedBoolean } from 'src/renderer/app/classes/timed-boolean';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import {
  headerNames,
  headerValues
} from 'src/renderer/app/constants/routes.constants';
import { HeadersProperties } from 'src/renderer/app/models/common.model';
import { DataSubject } from 'src/renderer/app/models/data.model';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-headers-list',
  templateUrl: 'headers-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    NgFor,
    NgbTypeahead,
    NgbTooltip,
    SvgComponent,
    AsyncPipe
  ]
})
export class HeadersListComponent implements OnInit {
  private formBuilder = inject(UntypedFormBuilder);
  private store = inject(Store);

  @Input()
  public activeDataSubject$: Observable<RouteResponse | Environment | Callback>;
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
  public dataSubject$: Observable<RouteResponse | Environment | Callback>;
  public form: UntypedFormGroup;
  public headerNamesSearch = this.buildSearch(headerNames);
  public headerValuesSearch = this.buildSearch(headerValues);
  public deleteHeaderRequested$ = new TimedBoolean();
  private listenToChanges = true;

  public get headers() {
    return this.form.get('headers') as UntypedFormArray;
  }

  constructor() {
    this.form = this.formBuilder.group({
      headers: this.formBuilder.array([])
    });

    // subscribe to changes and send new headers values to the store
    this.form.valueChanges
      .pipe(
        filter(() => this.listenToChanges),
        tap((formValue) => {
          this.headersUpdated.emit(formValue.headers);
        }),
        takeUntilDestroyed()
      )
      .subscribe();
  }

  ngOnInit() {
    // initialize the form depending on the env/route response headers
    this.dataSubject$ = this.activeDataSubject$.pipe(
      filter((dataSubject) => !!dataSubject),
      this.store.distinctUUIDOrForce(),
      tap((dataSubject) => {
        this.replaceHeaders(dataSubject[this.headersPropertyName], false);
      })
    );
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
                .filter((v) => v.toLowerCase().includes(term.toLowerCase()))
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
