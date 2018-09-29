import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AceEditorModule } from 'ng2-ace-editor';
import { DragulaModule } from 'ng2-dragula';
import 'reflect-metadata';
import { ContextMenuComponent } from 'src/app/components/context-menu.component';
import { EnvironmentLogsComponent } from 'src/app/components/environment-logs.component';
import { SettingsModalComponent } from 'src/app/components/settings-modal.component';
import { WelcomeModalComponent } from 'src/app/components/welcome-modal.component';
import { AutocompleteDirective } from 'src/app/directives/autocomplete.directive';
import { OnlyNumberDirective } from 'src/app/directives/only-numbers.directive';
import { ValidPathDirective } from 'src/app/directives/valid-path.directive';
import { AlertService } from 'src/app/services/alert.service';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { EventsService } from 'src/app/services/events.service';
import { ServerService } from 'src/app/services/server.service';
import { SettingsService } from 'src/app/services/settings.service';
import { UpdateService } from 'src/app/services/update.service';
import 'zone.js';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    OnlyNumberDirective,
    ValidPathDirective,
    ContextMenuComponent,
    AutocompleteDirective,
    WelcomeModalComponent,
    SettingsModalComponent,
    EnvironmentLogsComponent
  ],
  imports: [
    AceEditorModule,
    BrowserAnimationsModule,
    BrowserModule,
    DragulaModule.forRoot(),
    FormsModule,
    HttpClientModule,
    NgbModule.forRoot()
  ],
  providers: [
    AlertService,
    AnalyticsService,
    AuthService,
    EnvironmentsService,
    EventsService,
    ServerService,
    SettingsService,
    UpdateService,
    DataService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
