import { HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireRemoteConfigModule } from '@angular/fire/remote-config';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AceEditorModule } from 'ng2-ace-editor';
import { DragulaModule } from 'ng2-dragula';
import { MarkdownModule, MarkedOptions } from 'ngx-markdown';
import { BannerComponent } from 'src/app/components/banner.component';
import { ChangelogModalComponent } from 'src/app/components/changelog-modal.component';
import { ContextMenuComponent } from 'src/app/components/context-menu/context-menu.component';
import { EnvironmentLogsComponent } from 'src/app/components/environment-logs.component';
import { EnvironmentsMenuComponent } from 'src/app/components/environments-menu/environments-menu.component';
import { HeadersListComponent } from 'src/app/components/headers-list.component';
import { RouteResponseRulesComponent } from 'src/app/components/route-response-rules.component';
import { RoutesMenuComponent } from 'src/app/components/routes-menu/routes-menu.component';
import { SettingsModalComponent } from 'src/app/components/settings-modal.component';
import { WelcomeModalComponent } from 'src/app/components/welcome-modal.component';
import { Config } from 'src/app/config';
import { InputNumberDirective } from 'src/app/directives/input-number.directive';
import { MousedragDeadzoneDirective } from 'src/app/directives/mousedrag-deadzone.directive';
import { MousewheelUpdateDirective } from 'src/app/directives/mousewheel-update.directive';
import { ValidPathDirective } from 'src/app/directives/valid-path.directive';
import { MarkedOptionsFactory } from 'src/app/modules-config/markdown-factory';
import { GlobalErrorHandler } from 'src/app/services/error-handler';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    InputNumberDirective,
    ValidPathDirective,
    MousewheelUpdateDirective,
    MousedragDeadzoneDirective,
    ContextMenuComponent,
    WelcomeModalComponent,
    SettingsModalComponent,
    ChangelogModalComponent,
    EnvironmentLogsComponent,
    HeadersListComponent,
    BannerComponent,
    RouteResponseRulesComponent,
    EnvironmentsMenuComponent,
    RoutesMenuComponent
  ],
  imports: [
    AceEditorModule,
    BrowserAnimationsModule,
    BrowserModule,
    DragulaModule.forRoot(),
    FormsModule,
    HttpClientModule,
    NgbModule,
    MarkdownModule.forRoot({
      markedOptions: {
        provide: MarkedOptions,
        useFactory: MarkedOptionsFactory
      }
    }),
    AngularFireModule.initializeApp(Config.firebaseConfig),
    AngularFireAuthModule,
    AngularFireRemoteConfigModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
