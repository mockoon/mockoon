import { Transaction } from '@mockoon/commons';
import { Express, Request, Response } from 'express';

/**
 * Creates the Admin API endpoints
 * Documentation: https://mockoon.com/docs/latest/admin-api/overview/
 *
 * PURGE /mockoon-admin/state
 * POST /mockoon-admin/state/purge
 *
 * POST /mockoon-admin/global-vars
 * PUT /mockoon-admin/global-vars
 * PATCH /mockoon-admin/global-vars
 * PURGE /mockoon-admin/global-vars
 * POST /mockoon-admin/global-vars/purge
 *
 * GET /mockoon-admin/logs
 * PURGE /mockoon-admin/logs
 * POST /mockoon-admin/logs/purge
 *
 */
export const createAdminEndpoint = (
  app: Express,
  {
    statePurgeCallback,
    setGlobalVariables,
    purgeGlobalVariables,
    getLogs,
    purgeLogs
  }: {
    statePurgeCallback: () => void;
    setGlobalVariables: (key: string, value: any) => void;
    purgeGlobalVariables: () => void;
    getLogs: () => Transaction[];
    purgeLogs: () => void;
  }
) => {
  const adminApiPrefix = '/mockoon-admin';

  app.get(adminApiPrefix, (req, res) => {
    res.send({
      response:
        "Welcome to Mockoon's admin API. Check the documentation at https://mockoon.com/docs/latest/admin-api/overview/ for more information."
    });
  });

  const stateEndpoint = `${adminApiPrefix}/state`;
  const purgeHandler = (req, res) => {
    statePurgeCallback();

    res.send({
      response: 'Server state has been purged'
    });
  };

  const setGlobalVar = (req, res) => {
    try {
      const { key, value } = req.body; // Destructure key and value from req.body
      if (key && value) {
        setGlobalVariables(key, value); // Set global variables
        res.send({
          message: `Global variable ${key} has been set to ${value}`
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
        message: 'Global variables have been purged'
      });
    } catch (err) {
      res.status(500).send({ message: 'Failed to purge global variables' });
    }
  };

  const getLogsHandler = (req: Request, res: Response) => {
    const page =
      typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
    const limit =
      typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 10;
    const logs = getLogs();
    const start = (page - 1) * limit;

    res.send(logs.slice(start, start + limit));
  };

  const purgeLogsHandler = (req, res) => {
    try {
      purgeLogs();
      res.send({
        message: 'Logs have been purged'
      });
    } catch (err) {
      res.status(500).send({ message: 'Failed to purge logs' });
    }
  };

  app.purge(stateEndpoint, purgeHandler);
  app.post(`${stateEndpoint}/purge`, purgeHandler);

  app.get(`${adminApiPrefix}/logs`, getLogsHandler);
  app.post(`${adminApiPrefix}/logs/purge`, purgeLogsHandler);
  app.purge(`${adminApiPrefix}/logs`, purgeLogsHandler);

  app.post(`${adminApiPrefix}/global-vars`, setGlobalVar);
  app.put(`${adminApiPrefix}/global-vars`, setGlobalVar);
  app.patch(`${adminApiPrefix}/global-vars`, setGlobalVar);
  app.purge(`${adminApiPrefix}/global-vars`, purgeGlobalVars);
  app.post(`${adminApiPrefix}/global-vars/purge`, purgeGlobalVars);
};
