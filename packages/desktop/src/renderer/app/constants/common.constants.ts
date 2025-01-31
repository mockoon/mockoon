import { initMainApi } from 'src/renderer/app/classes/main-api';
import { MainAPIModel } from 'src/renderer/app/models/main-api.model';
import { environment } from 'src/renderer/environments/environment';

if (environment.web) {
  window.api = initMainApi();
}

export const MainAPI: MainAPIModel = window.api;
