import { SharedConfig } from 'src/shared/shared-config';

declare const WEBSITE_URL: string;
declare const API_URL: string;

/**
 * Main process config (Node.js)
 */
export const Config = SharedConfig({
  apiURL: API_URL,
  websiteURL: WEBSITE_URL
});
