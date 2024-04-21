import { Express } from 'express';
const adminApiPrefix = '/mockoon-admin';

/**
 * Expose two endpoints to purge the state
 * PURGE /mockoon-admin/state
 * POST /mockoon-admin/state/purge
 * POST /mockoon-admin/state/setGlobalVars
 * POST /mockoon-admin/state/purgeGlobalVars
 *
 * @param app
 * @param statePurgeCallback
 * @param setGlibalVariables
 * @param purgeGlobalVariables
 */
const createStateEndpoints = (
  app: Express,
  statePurgeCallback: () => void,
  setGlobalVariables: (key: string, value: any) => void,
  purgeGlobalVariables: () => void
) => {
  const stateEndpoint = `${adminApiPrefix}/state`;
  const purgeHandler = (req, res) => {
    statePurgeCallback();
    res.send({
      response: 'State purged successfully.'
    });
  };
  const setGlobalVar = (req, res) => {
    try {
      const { key, value } = req.body; // Destructure key and value from req.body
      if (key && value) {
        setGlobalVariables(key, value); // Set global variables
        res.send({
          message: `Global variable ${key} has been set to ${value}.`
        });
      } else {
        throw new Error('Key or value missing from request'); // Throw error if key or value are missing
      }
    } catch (err) {
      res.status(400).send({ message: 'Invalid JSON or missing key/value' });
    }
  };
  const purgeGlobalVars = (req, res) => {
    try {
      purgeGlobalVariables();
      res.send({
        message: 'Global variables have been purged.'
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({ message: 'Failed to purge global variable' });
    }
  };
  app.purge(stateEndpoint, purgeHandler);
  app.post(`${stateEndpoint}/purge`, purgeHandler);
  app.post(`${adminApiPrefix}/global-vars`, setGlobalVar);
  app.put(`${adminApiPrefix}/global-vars`, setGlobalVar);
  app.patch(`${adminApiPrefix}/global-vars`, setGlobalVar);
  app.purge(`${adminApiPrefix}/global-vars`, purgeGlobalVars);
  app.post(`${adminApiPrefix}/global-vars/purge`, purgeGlobalVars);
};

/**
 * Create the admin endpoints
 *
 * @param app
 * @param { statePurgeCallback }
 * @param setGlibalVariables
 * @param purgeGlobalVariables
 */
export const createAdminEndpoint = (
  app: Express,
  { statePurgeCallback }: { statePurgeCallback: () => void },
  setGlobalVariables: (key: string, value: any) => void,
  purgeGlobalVariables: () => void
) => {
  app.get(adminApiPrefix, (req, res) => {
    res.send({
      response:
        "Welcome to Mockoon's admin API. Check the documentation at https://mockoon.com/docs/latest/admin-api/overview/ for more information."
    });
  });
  createStateEndpoints(
    app,
    statePurgeCallback,
    setGlobalVariables,
    purgeGlobalVariables
  );
};
