import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule, SecurityContext } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {
  connectFunctionsEmulator,
  getFunctions,
  provideFunctions
} from '@angular/fire/functions';
import {
  getRemoteConfig,
  provideRemoteConfig
} from '@angular/fire/remote-config';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  NgbConfig,
  NgbDropdownConfig,
  NgbModalConfig,
  NgbModule,
  NgbTooltipConfig,
  NgbTypeaheadConfig
} from '@ng-bootstrap/ng-bootstrap';
import { MarkdownModule, MarkedOptions } from 'ngx-markdown';
import { NgxMaskModule } from 'ngx-mask';
import { BannerComponent } from 'src/renderer/app/components/banner/banner.component';
import { ContextMenuComponent } from 'src/renderer/app/components/context-menu/context-menu.component';
import { CustomSelectComponent } from 'src/renderer/app/components/custom-select/custom-select.component';
import { EditorComponent } from 'src/renderer/app/components/editor/editor.component';
import { EnvironmentHeadersComponent } from 'src/renderer/app/components/environment-headers/environment-headers.component';
import { EnvironmentLogsComponent } from 'src/renderer/app/components/environment-logs/environment-logs.component';
import { EnvironmentProxyComponent } from 'src/renderer/app/components/environment-proxy/environment-proxy.component';
import { EnvironmentRoutesComponent } from 'src/renderer/app/components/environment-routes/environment-routes.component';
import { EnvironmentSettingsComponent } from 'src/renderer/app/components/environment-settings/environment-settings.component';
import { FooterComponent } from 'src/renderer/app/components/footer/footer.component';
import { HeaderComponent } from 'src/renderer/app/components/header/header.component';
import { HeadersListComponent } from 'src/renderer/app/components/headers-list/headers-list.component';
import { EnvironmentsMenuComponent } from 'src/renderer/app/components/menus/environments-menu/environments-menu.component';
import { RoutesMenuComponent } from 'src/renderer/app/components/menus/routes-menu/routes-menu.component';
import { ChangelogModalComponent } from 'src/renderer/app/components/modals/changelog-modal/changelog-modal.component';
import { ConfirmModalComponent } from 'src/renderer/app/components/modals/confirm-modal/confirm-modal.component';
import { DuplicateRouteModalComponent } from 'src/renderer/app/components/modals/duplicate-route-modal/duplicate-route-modal.component';
import { EditorModalComponent } from 'src/renderer/app/components/modals/editor-modal/editor-modal.component';
import { SettingsModalComponent } from 'src/renderer/app/components/modals/settings-modal/settings-modal.component';
import { WelcomeModalComponent } from 'src/renderer/app/components/modals/welcome-modal/welcome-modal.component';
import { RouteResponseRulesComponent } from 'src/renderer/app/components/route-response-rules/route-response-rules.component';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { TitleSeparatorComponent } from 'src/renderer/app/components/title-separator/title-separator.component';
import { FocusOnEventDirective } from 'src/renderer/app/directives/focus-event.directive';
import { InputNumberDirective } from 'src/renderer/app/directives/input-number.directive';
import { MousedragDeadzoneDirective } from 'src/renderer/app/directives/mousedrag-deadzone.directive';
import { ResizeColumnDirective } from 'src/renderer/app/directives/resize-column.directive';
import { ValidPathDirective } from 'src/renderer/app/directives/valid-path.directive';
import { MarkedOptionsFactory } from 'src/renderer/app/modules-config/markdown.config';
import { NgbDropdownConfigFactory } from 'src/renderer/app/modules-config/ngb-dropdown.config';
import { NgbModalConfigFactory } from 'src/renderer/app/modules-config/ngb-modal.config';
import { NgbTooltipConfigFactory } from 'src/renderer/app/modules-config/ngb-tooltip.config';
import { NgbTypeaheadConfigFactory } from 'src/renderer/app/modules-config/ngb-typeahead.config';
import { NgbConfigFactory } from 'src/renderer/app/modules-config/ngb.config';
import { GlobalErrorHandler } from 'src/renderer/app/services/global-error-handler';
import { environment } from 'src/renderer/environments/environment';
import { Config } from 'src/shared/config';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    InputNumberDirective,
    ResizeColumnDirective,
    ValidPathDirective,
    MousedragDeadzoneDirective,
    FocusOnEventDirective,
    ContextMenuComponent,
    WelcomeModalComponent,
    SettingsModalComponent,
    ChangelogModalComponent,
    EditorModalComponent,
    ConfirmModalComponent,
    EnvironmentLogsComponent,
    EnvironmentProxyComponent,
    EnvironmentHeadersComponent,
    EnvironmentSettingsComponent,
    EnvironmentRoutesComponent,
    HeadersListComponent,
    BannerComponent,
    RouteResponseRulesComponent,
    EnvironmentsMenuComponent,
    RoutesMenuComponent,
    TitleSeparatorComponent,
    FooterComponent,
    DuplicateRouteModalComponent,
    EditorComponent,
    CustomSelectComponent,
    SvgComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    DragDropModule,
    FormsModule,
    HttpClientModule,
    NgbModule,
    MarkdownModule.forRoot({
      sanitize: SecurityContext.NONE,
      markedOptions: {
        provide: MarkedOptions,
        useFactory: MarkedOptionsFactory
      }
    }),
    provideFirebaseApp(() => initializeApp(Config.firebaseConfig)),
    provideRemoteConfig(() => {
      const remoteConfig = getRemoteConfig();

      if (!environment.production) {
        remoteConfig.settings.minimumFetchIntervalMillis = 1000;
      }

      return remoteConfig;
    }),
    provideFunctions(() => {
      const functions = getFunctions();

      if (environment.useFirebaseEmulator) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
      }

      return functions;
    }),
    ReactiveFormsModule,
    NgxMaskModule.forRoot()
  ],
  providers: [
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
      useFactory: NgbTooltipConfigFactory,
      deps: [NgbConfig]
    },
    {
      provide: NgbDropdownConfig,
      useFactory: NgbDropdownConfigFactory
    },
    {
      provide: NgbModalConfig,
      useFactory: NgbModalConfigFactory
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
