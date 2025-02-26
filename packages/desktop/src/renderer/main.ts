import {
  enableProdMode,
  ErrorHandler,
  importProvidersFrom,
  SecurityContext
} from '@angular/core';
import { MainAPIModel } from 'src/renderer/app/models/main-api.model';

import { DatePipe } from '@angular/common';
import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import {
  connectFunctionsEmulator,
  getFunctions,
  provideFunctions
} from '@angular/fire/functions';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  NgbConfig,
  NgbDropdownConfig,
  NgbModalConfig,
  NgbModule,
  NgbTooltipConfig,
  NgbTypeaheadConfig
} from '@ng-bootstrap/ng-bootstrap';
import { browserLocalPersistence, connectAuthEmulator } from 'firebase/auth';
import { MarkdownModule, MARKED_OPTIONS } from 'ngx-markdown';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { AppComponent } from 'src/renderer/app/app.component';
import { MarkedOptionsFactory } from 'src/renderer/app/modules-config/markdown.config';
import { NgbDropdownConfigFactory } from 'src/renderer/app/modules-config/ngb-dropdown.config';
import { NgbModalConfigFactory } from 'src/renderer/app/modules-config/ngb-modal.config';
import { NgbTooltipConfigFactory } from 'src/renderer/app/modules-config/ngb-tooltip.config';
import { NgbTypeaheadConfigFactory } from 'src/renderer/app/modules-config/ngb-typeahead.config';
import { NgbConfigFactory } from 'src/renderer/app/modules-config/ngb.config';
import { GlobalErrorHandler } from 'src/renderer/app/services/global-error-handler';
import { Config } from 'src/renderer/config';
import { environment } from 'src/renderer/environments/environment';

declare global {
  interface Window {
    api: MainAPIModel;
    electronRequire: NodeRequire;
  }
}

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      FormsModule,
      NgbModule,
      MarkdownModule.forRoot({
        sanitize: SecurityContext.NONE,
        markedOptions: {
          provide: MARKED_OPTIONS,
          useFactory: MarkedOptionsFactory
        }
      }),
      ReactiveFormsModule.withConfig({
        // enable the legacy disabled state handling (angular v15)
        callSetDisabledState: 'whenDisabledForLegacyCode'
      }),
      NgxMaskDirective
    ),
    DatePipe,
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    },
    {
      provide: NgbConfig,
      useFactory: NgbConfigFactory
    },
    {
      provide: NgbTypeaheadConfig,
      useFactory: NgbTypeaheadConfigFactory
    },
    {
      provide: NgbTooltipConfig,
      useFactory: NgbTooltipConfigFactory
    },
    {
      provide: NgbDropdownConfig,
      useFactory: NgbDropdownConfigFactory
    },
    {
      provide: NgbModalConfig,
      useFactory: NgbModalConfigFactory
    },
    provideNgxMask(),
    provideHttpClient(withInterceptorsFromDi()),
    provideFirebaseApp(() => initializeApp(Config.firebaseConfig)),
    provideAuth(() => {
      const auth = getAuth();
      auth.setPersistence(browserLocalPersistence);

      if (environment.useFirebaseEmulator) {
        connectAuthEmulator(auth, 'http://localhost:9099', {
          disableWarnings: true
        });
      }

      return auth;
    }),
    provideFunctions(() => {
      const functions = getFunctions();

      if (environment.useFirebaseEmulator) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
      }

      return functions;
    }),
    provideAnimations()
  ]
})
  // eslint-disable-next-line no-console
  .catch((err) => console.error(err));
