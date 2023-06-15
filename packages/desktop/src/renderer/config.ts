import { environment } from 'src/renderer/environments/environment';
import { SharedConfig } from 'src/shared/shared-config';

const websiteURL = environment.websiteURL;
const apiURL = environment.apiURL;

/**
 * Renderer process config (Angular)
 */
export const Config = SharedConfig({
  apiURL,
  websiteURL
});
