import { HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule, SecurityContext } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import {
  connectFunctionsEmulator,
  getFunctions,
  provideFunctions
} from '@angular/fire/functions';
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
import { browserLocalPersistence, connectAuthEmulator } from 'firebase/auth';
import { MarkdownModule, MarkedOptions } from 'ngx-markdown';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { BannerComponent } from 'src/renderer/app/components/banner/banner.component';
import { ContextMenuComponent } from 'src/renderer/app/components/context-menu/context-menu.component';
import { CustomSelectComponent } from 'src/renderer/app/components/custom-select/custom-select.component';
import { EditableElementComponent } from 'src/renderer/app/components/editable-element/editable-element.component';
import { EditorComponent } from 'src/renderer/app/components/editor/editor.component';
import { EnvironmentCallbacksComponent } from 'src/renderer/app/components/environment-callbacks/environment-callbacks.component';
import { EnvironmentDatabucketsComponent } from 'src/renderer/app/components/environment-databuckets/environment-databuckets.component';
import { EnvironmentHeadersComponent } from 'src/renderer/app/components/environment-headers/environment-headers.component';
import { EnvironmentLogsComponent } from 'src/renderer/app/components/environment-logs/environment-logs.component';
import { EnvironmentProxyComponent } from 'src/renderer/app/components/environment-proxy/environment-proxy.component';
import { EnvironmentRoutesComponent } from 'src/renderer/app/components/environment-routes/environment-routes.component';
import { EnvironmentSettingsComponent } from 'src/renderer/app/components/environment-settings/environment-settings.component';
import { FooterComponent } from 'src/renderer/app/components/footer/footer.component';
import { HeaderComponent } from 'src/renderer/app/components/header/header.component';
import { HeadersListComponent } from 'src/renderer/app/components/headers-list/headers-list.component';
import { CallbacksMenuComponent } from 'src/renderer/app/components/menus/callbacks-menu/callbacks-menu.component';
import { DatabucketsMenuComponent } from 'src/renderer/app/components/menus/databuckets-menu/databuckets-menu.component';
import { EnvironmentsMenuComponent } from 'src/renderer/app/components/menus/environments-menu/environments-menu.component';
import { RoutesMenuComponent } from 'src/renderer/app/components/menus/routes-menu/routes-menu.component';
import { AuthModalComponent } from 'src/renderer/app/components/modals/auth-modal/auth-modal.component';
import { ChangelogModalComponent } from 'src/renderer/app/components/modals/changelog-modal/changelog-modal.component';
import { CommandPaletteModalComponent } from 'src/renderer/app/components/modals/command-palette-modal/command-palette-modal.component';
import { ConfirmModalComponent } from 'src/renderer/app/components/modals/confirm-modal/confirm-modal.component';
import { DuplicateModalComponent } from 'src/renderer/app/components/modals/duplicate-modal/duplicate-modal.component';
import { EditorModalComponent } from 'src/renderer/app/components/modals/editor-modal/editor-modal.component';
import { SettingsModalComponent } from 'src/renderer/app/components/modals/settings-modal/settings-modal.component';
import { TemplatesModalComponent } from 'src/renderer/app/components/modals/templates-modal/templates-modal.component';
import { WelcomeModalComponent } from 'src/renderer/app/components/modals/welcome-modal/welcome-modal.component';
import { RouteCallbacksComponent } from 'src/renderer/app/components/route-callbacks/route-callbacks.component';
import { RouteResponseRulesComponent } from 'src/renderer/app/components/route-response-rules/route-response-rules.component';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { TitleSeparatorComponent } from 'src/renderer/app/components/title-separator/title-separator.component';
import { ToggleComponent } from 'src/renderer/app/components/toggle/toggle.component';
import { TourComponent } from 'src/renderer/app/components/tour/tour.component';
import { DraggableDirective } from 'src/renderer/app/directives/draggable.directive';
import { DropzoneDirective } from 'src/renderer/app/directives/dropzone.directive';
import { FocusOnEventDirective } from 'src/renderer/app/directives/focus-event.directive';
import { InputNumberDirective } from 'src/renderer/app/directives/input-number.directive';
import { ResizeColumnDirective } from 'src/renderer/app/directives/resize-column.directive';
import { ScrollWhenActiveDirective } from 'src/renderer/app/directives/scroll-to-active.directive';
import { TourStepDirective } from 'src/renderer/app/directives/tour-step.directive';
import { ValidPathDirective } from 'src/renderer/app/directives/valid-path.directive';
import { MarkedOptionsFactory } from 'src/renderer/app/modules-config/markdown.config';
import { NgbDropdownConfigFactory } from 'src/renderer/app/modules-config/ngb-dropdown.config';
import { NgbModalConfigFactory } from 'src/renderer/app/modules-config/ngb-modal.config';
import { NgbTooltipConfigFactory } from 'src/renderer/app/modules-config/ngb-tooltip.config';
import { NgbTypeaheadConfigFactory } from 'src/renderer/app/modules-config/ngb-typeahead.config';
import { NgbConfigFactory } from 'src/renderer/app/modules-config/ngb.config';
import { GlobalErrorHandler } from 'src/renderer/app/services/global-error-handler';
import { Config } from 'src/renderer/config';
import { environment } from 'src/renderer/environments/environment';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    InputNumberDirective,
    ResizeColumnDirective,
    ValidPathDirective,
    FocusOnEventDirective,
    DraggableDirective,
    DropzoneDirective,
    ScrollWhenActiveDirective,
    ContextMenuComponent,
    CommandPaletteModalComponent,
    AuthModalComponent,
    WelcomeModalComponent,
    SettingsModalComponent,
    ChangelogModalComponent,
    EditorModalComponent,
    ConfirmModalComponent,
    TemplatesModalComponent,
    EnvironmentLogsComponent,
    EnvironmentProxyComponent,
    EnvironmentHeadersComponent,
    EnvironmentSettingsComponent,
    EnvironmentRoutesComponent,
    EnvironmentDatabucketsComponent,
    EnvironmentCallbacksComponent,
    HeadersListComponent,
    BannerComponent,
    RouteResponseRulesComponent,
    RouteCallbacksComponent,
    EnvironmentsMenuComponent,
    RoutesMenuComponent,
    DatabucketsMenuComponent,
    CallbacksMenuComponent,
    TitleSeparatorComponent,
    FooterComponent,
    DuplicateModalComponent,
    EditorComponent,
    CustomSelectComponent,
    ToggleComponent,
    SvgComponent,
    EditableElementComponent,
    TourComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    NgbModule,
    TourStepDirective,
    MarkdownModule.forRoot({
      sanitize: SecurityContext.NONE,
      markedOptions: {
        provide: MarkedOptions,
        useFactory: MarkedOptionsFactory
      }
    }),
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
    ReactiveFormsModule,
    NgxMaskDirective
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
    },
    provideNgxMask()
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
