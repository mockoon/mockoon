import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ContextMenuComponent } from 'app/components/context-menu.component';
import { SettingsModalComponent } from 'app/components/settings-modal.component';
import { WelcomeModalComponent } from 'app/components/welcome-modal.component';
import { AutocompleteDirective } from 'app/directives/autocomplete.directive';
import { OnlyNumberDirective } from 'app/directives/only-numbers.directive';
import { ValidPathDirective } from 'app/directives/valid-path.directive';
import { AlertService } from 'app/services/alert.service';
import { AnalyticsService } from 'app/services/analytics.service';
import { AuthService } from 'app/services/auth.service';
import { EnvironmentsService } from 'app/services/environments.service';
import { EventsService } from 'app/services/events.service';
import { ServerService } from 'app/services/server.service';
import { SettingsService } from 'app/services/settings.service';
import { UpdateService } from 'app/services/update.service';
import { AceEditorModule } from 'ng2-ace-editor';
import 'reflect-metadata';
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
    SettingsModalComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpModule,
    AceEditorModule,
    NgbModule.forRoot()
  ],
  providers: [
    EnvironmentsService,
    ServerService,
    AlertService,
    UpdateService,
    AnalyticsService,
    AuthService,
    EventsService,
    SettingsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
