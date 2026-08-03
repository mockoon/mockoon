import { environment } from 'src/renderer/environments/environment';
import { SharedConfig } from 'src/shared/shared-config';

const websiteUrl = environment.websiteUrl;
const defaultApiUrl = environment.defaultApiUrl;
const isWeb = environment.web;

/**
 * Renderer process config (Angular)
 */
export const Config = SharedConfig({
  defaultApiUrl,
  websiteUrl,
  isWeb
});
