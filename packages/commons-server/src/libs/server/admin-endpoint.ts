import { Express } from 'express';

const adminApiPrefix = '/mockoon-admin';

/**
 * Expose two endpoints to purge the state
 * PURGE /mockoon-admin/state
 * POST /mockoon-admin/state/purge
 *
 * @param app
 * @param statePurgeCallback
 */
const createStateEndpoints = (app: Express, statePurgeCallback: () => void) => {
  const stateEndpoint = `${adminApiPrefix}/state`;
  const purgeHandler = (req, res) => {
    statePurgeCallback();
    res.send({
      response: 'State purged successfully.'
    });
  };

  app.purge(stateEndpoint, purgeHandler);
  app.post(`${stateEndpoint}/purge`, purgeHandler);
};

/**
 * Create the admin endpoints
 *
 * @param app
 */
export const createAdminEndpoint = (
  app: Express,
  { statePurgeCallback }: { statePurgeCallback: () => void }
) => {
  app.get(adminApiPrefix, (req, res) => {
    res.send({
      response:
        "Welcome to Mockoon's admin API. Check the documentation at https://mockoon.com/docs/latest/admin-api/overview/ for more information."
    });
  });

  createStateEndpoints(app, statePurgeCallback);
};
