import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, distinctUntilKeyChanged, filter, map } from 'rxjs/operators';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { EventsService } from 'src/app/services/events.service';
import { ServerService } from 'src/app/services/server.service';
import { Environment } from 'src/app/types/environment.type';
import { Header, headerNames, headerValues, RouteResponse } from 'src/app/types/route.type';

export type HeadersListType = 'routeResponseHeaders' | 'environmentHeaders';

@Component({
  selector: 'app-headers-list',
  templateUrl: 'headers-list.component.html'
})
export class HeadersListComponent implements OnInit {
  @Input() data$: Observable<Environment | RouteResponse>;
  @Input() type: HeadersListType;
  @Input() headers: 'headers' | 'proxyReqHeaders' | 'proxyResHeaders' =
    'headers';
  @Output() headerAdded: EventEmitter<any> = new EventEmitter();
  public form: FormGroup;
  public headersFormChanges: Subscription;
  public testHeaderValidity = this.serverService.testHeaderValidity;

  constructor(
    private serverService: ServerService,
    private environmentsService: EnvironmentsService,
    private formBuilder: FormBuilder,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      headers: this.formBuilder.array([])
    });

    // subscribe to header injection events
    this.eventsService.injectHeaders
      .pipe(
        filter(data => data.target === this.type),
        map(data => data[this.headers] || [])
      )
      .subscribe(headers => this.injectHeaders(headers));

    // subscribe to headers changes to reset the form
    this.data$
      .pipe(
        filter(data => !!data),
        distinctUntilKeyChanged('uuid')
      )
      .subscribe(data => {
        // unsubscribe to prevent emitting when clearing the FormArray
        if (this.headersFormChanges) {
          this.headersFormChanges.unsubscribe();
        }

        this.replaceHeaders(data[this.headers]);

        // subscribe to changes and send new headers values to the store
        this.headersFormChanges = this.form
          .get('headers')
          .valueChanges.pipe(map(newValue => ({ [this.headers]: newValue })))
          .subscribe(newProperty => {
            if (this.type === 'environmentHeaders') {
              this.environmentsService.updateActiveEnvironment(newProperty);
            } else if (this.type === 'routeResponseHeaders') {
              this.environmentsService.updateActiveRouteResponse(newProperty);
            }
          });
      });
  }

  /**
   * Replace existing header with injected header value, or append injected header
   */
  private injectHeaders(headers: Header[]) {
    const newHeaders = [...this.form.value.headers];

    headers.forEach(header => {
      const headerExistsIndex = newHeaders.findIndex(
        newHeader => newHeader.key === header.key
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
  private replaceHeaders(newHeaders: Header[]) {
    const formHeadersArray = this.form.get('headers') as FormArray;

    // clear formArray (with Angular 8 use .clear())
    while (formHeadersArray.length !== 0) {
      formHeadersArray.removeAt(0);
    }

    newHeaders.forEach(header => {
      formHeadersArray.push(
        this.formBuilder.group({
          key: header.key,
          value: header.value
        })
      );
    });
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
        map(term =>
          term.length < 1
            ? []
            : list
                .filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
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
