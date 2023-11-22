import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { MainAPIModel } from 'src/renderer/app/models/main-api.model';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

declare global {
  interface Window {
    api: MainAPIModel;
    electronRequire: NodeRequire;
  }
}

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  // eslint-disable-next-line no-console
  .catch((err) => console.error(err));
