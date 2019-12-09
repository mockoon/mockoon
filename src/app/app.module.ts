import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule, FirestoreSettingsToken } from '@angular/fire/firestore';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AceEditorModule } from 'ng2-ace-editor';
import { DragulaModule } from 'ng2-dragula';
import { MarkdownModule, MarkedOptions } from 'ngx-markdown';
import { BannerComponent } from 'src/app/components/banner.component';
import { ChangelogModalComponent } from 'src/app/components/changelog-modal.component';
import { ContextMenuComponent } from 'src/app/components/context-menu.component';
import { EnvironmentLogsComponent } from 'src/app/components/environment-logs.component';
import { HeadersListComponent } from 'src/app/components/headers-list.component';
import { RouteResponseRulesComponent } from 'src/app/components/route-response-rules.component';
import { SettingsModalComponent } from 'src/app/components/settings-modal.component';
import { WelcomeModalComponent } from 'src/app/components/welcome-modal.component';
import { Config } from 'src/app/config';
import { InputNumberDirective } from 'src/app/directives/input-number.directive';
import { MousedragDeadzoneDirective } from 'src/app/directives/mousedrag-deadzone.directive';
import { MousewheelUpdateDirective } from 'src/app/directives/mousewheel-update.directive';
import { ValidPathDirective } from 'src/app/directives/valid-path.directive';
import { MarkedOptionsFactory } from 'src/app/modules-config/markdown-factory';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
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
    TruncatePipe
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
    AngularFirestoreModule,
    ReactiveFormsModule
  ],
  providers: [{ provide: FirestoreSettingsToken, useValue: {} }],
  bootstrap: [AppComponent]
})
export class AppModule {}
