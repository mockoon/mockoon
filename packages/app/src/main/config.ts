import { SharedConfig } from 'src/shared/shared-config';

declare const WEBSITE_URL: string;
declare const DEFAULT_API_URL: string;

/**
 * Main process config (Node.js)
 */
export const Config = SharedConfig({
  defaultApiUrl: DEFAULT_API_URL,
  websiteUrl: WEBSITE_URL
});
