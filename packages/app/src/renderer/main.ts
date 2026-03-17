import {
  enableProdMode,
  ErrorHandler,
  importProvidersFrom,
  provideZoneChangeDetection,
  SecurityContext
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import {
  NgbConfig,
  NgbDropdownConfig,
  NgbModalConfig,
  NgbModule,
  NgbTooltipConfig,
  NgbTypeaheadConfig
} from '@ng-bootstrap/ng-bootstrap';
import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth
} from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { MARKED_OPTIONS, provideMarkdown, SANITIZE } from 'ngx-markdown';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { AppComponent } from 'src/renderer/app/app.component';
import { checkSingleInstance } from 'src/renderer/app/libs/single-instance-checker.lib';
import { MainAPIModel } from 'src/renderer/app/models/main-api.model';
import { MarkedOptionsFactory } from 'src/renderer/app/modules-config/markdown.config';
import { NgbDropdownConfigFactory } from 'src/renderer/app/modules-config/ngb-dropdown.config';
import { NgbModalConfigFactory } from 'src/renderer/app/modules-config/ngb-modal.config';
import { NgbTooltipConfigFactory } from 'src/renderer/app/modules-config/ngb-tooltip.config';
import { NgbTypeaheadConfigFactory } from 'src/renderer/app/modules-config/ngb-typeahead.config';
import { NgbConfigFactory } from 'src/renderer/app/modules-config/ngb.config';
import { GlobalErrorHandler } from 'src/renderer/app/services/global-error-handler';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { Config } from 'src/renderer/config';
import { environment } from 'src/renderer/environments/environment';

declare global {
  interface Window {
    api: MainAPIModel;
  }
}

if (environment.production) {
  enableProdMode();
}

const firebaseApp = initializeApp(Config.firebaseConfig);
const auth = getAuth(firebaseApp);
auth.setPersistence(browserLocalPersistence);

if (environment.useFirebaseEmulator) {
  connectAuthEmulator(auth, 'http://localhost:9099', {
    disableWarnings: true
  });
}

const functions = getFunctions(firebaseApp);

if (environment.useFirebaseEmulator) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

const bootstrap = () => {
  bootstrapApplication(AppComponent, {
    providers: [
      provideZoneChangeDetection(),
      importProvidersFrom(
        BrowserModule,
        FormsModule,
        NgbModule,
        ReactiveFormsModule.withConfig({
          // enable the legacy disabled state handling (angular v15)
          callSetDisabledState: 'whenDisabledForLegacyCode'
        }),
        NgxMaskDirective
      ),
      provideMarkdown({
        sanitize: { provide: SANITIZE, useValue: SecurityContext.NONE },
        markedOptions: {
          provide: MARKED_OPTIONS,
          useFactory: MarkedOptionsFactory
        }
      }),
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
      {
        /* Either get the main API from window.api (electron's preload script + ipc.ts) or from a service, for the web version */
        provide: MainApiService,
        useFactory: () => (environment.web ? new MainApiService() : window.api)
      }
    ]
  })
    // eslint-disable-next-line no-console
    .catch((err) => console.error(err));
};

// delay bootstrap to display the loading screen and wait for single instance check
setTimeout(() => {
  if (environment.web) {
    checkSingleInstance().then((result) => {
      if (!result) {
        return;
      }

      bootstrap();
    });
  } else {
    bootstrap();
  }
}, 1000);
