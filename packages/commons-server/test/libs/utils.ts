export const testAdminApiToken = 'test-admin-api-token';

export const adminFetch = (url: string, path: string, init: RequestInit = {}) =>
  fetch(`${url}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${testAdminApiToken}`
    }
  });
