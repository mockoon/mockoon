import { environment } from 'src/renderer/environments/environment';
import { SharedConfig } from 'src/shared/shared-config';

const websiteUrl = environment.websiteUrl;
const defaultApiUrl = environment.defaultApiUrl;
const isWeb = environment.web;
let callbackApiUrl: string | null = null;

/**
 * Renderer process config (Angular)
 */
export const Config = SharedConfig({
  defaultApiUrl,
  websiteUrl,
  isWeb
});

/**
 * Used to set the self-hosted API URL early, from the query params when redirected from the self hosted backend
 *
 * @param apiUrl
 * @returns
 */
export const setCallbackApiUrl = (apiUrl: string | null) => {
  if (!apiUrl) {
    return;
  }

  try {
    const normalizedApiUrl = new URL(apiUrl);

    if (
      normalizedApiUrl.protocol !== 'http:' &&
      normalizedApiUrl.protocol !== 'https:'
    ) {
      return;
    }

    callbackApiUrl = normalizedApiUrl.origin;
  } catch {
    return;
  }
};

export const getCallbackApiUrl = () => callbackApiUrl;
