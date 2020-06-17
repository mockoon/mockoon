import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import 'brace';
import 'brace/ext/searchbox';
import 'brace/index';
import 'brace/mode/css';
import 'brace/mode/html.js';
import 'brace/mode/json.js';
import 'brace/mode/text.js';
import 'brace/mode/xml.js';
import { AppModule } from './app/app.module';
import './assets/custom_theme.js';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
