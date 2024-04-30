import { Transaction } from '@mockoon/commons';
import { Express, Request, Response } from 'express';

/**
 * Creates the Admin API endpoints
 * Documentation: https://mockoon.com/docs/latest/admin-api/overview/
 *
 * PURGE /mockoon-admin/state
 * POST /mockoon-admin/state/purge
 *
 * POST /mockoon-admin/env-vars
 * PUT /mockoon-admin/env-vars
 * PATCH /mockoon-admin/env-vars
 *
 * POST /mockoon-admin/global-vars
 * PUT /mockoon-admin/global-vars
 * PATCH /mockoon-admin/global-vars
 * PURGE /mockoon-admin/global-vars
 * POST /mockoon-admin/global-vars/purge
 *
 * PURGE /mockoon-admin/data-buckets
 * POST /mockoon-admin/data-buckets/purge
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
    purgeDataBuckets,
    getLogs,
    purgeLogs
  }: {
    statePurgeCallback: () => void;
    setGlobalVariables: (key: string, value: any) => void;
    purgeGlobalVariables: () => void;
    purgeDataBuckets: () => void;
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

    purgeDataBuckets();
    purgeGlobalVariables();
    purgeLogs();

    res.send({
      response: 'Server has been reset to its initial state'
    });
  };

  const setEnvVarHandler = (req, res) => {
    try {
      const { key, value } = req.body;
      if (key !== undefined && value !== undefined) {
        process.env[key] = value;

        res.send({
          message: `Environment variable '${key}' has been set to '${value}'`
        });
      } else {
        throw new Error('Key or value missing from request');
      }
    } catch (err) {
      res.status(400).send({ message: 'Invalid JSON or missing key/value' });
    }
  };

  const setGlobalVarHandler = (req, res) => {
    try {
      const { key, value } = req.body;
      if (key !== undefined && value !== undefined) {
        setGlobalVariables(key, value);
        res.send({
          message: `Global variable '${key}' has been set to '${value}'`
        });
      } else {
        throw new Error('Key or value missing from request');
      }
    } catch (err) {
      res.status(400).send({ message: 'Invalid JSON or missing key/value' });
    }
  };

  const purgeGlobalVarsHandler = (req, res) => {
    try {
      purgeGlobalVariables();
      res.send({
        message: 'Global variables have been purged'
      });
    } catch (err) {
      res.status(500).send({ message: 'Failed to purge global variables' });
    }
  };

  const purgeDataBucketsHandler = (req, res) => {
    try {
      purgeDataBuckets();
      res.send({
        message: 'Data buckets have been reset to their initial state'
      });
    } catch (err) {
      res.status(500).send({ message: 'Failed to reset the data buckets' });
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

  app.post(`${adminApiPrefix}/env-vars`, setEnvVarHandler);
  app.put(`${adminApiPrefix}/env-vars`, setEnvVarHandler);
  app.patch(`${adminApiPrefix}/env-vars`, setEnvVarHandler);

  app.post(`${adminApiPrefix}/global-vars`, setGlobalVarHandler);
  app.put(`${adminApiPrefix}/global-vars`, setGlobalVarHandler);
  app.patch(`${adminApiPrefix}/global-vars`, setGlobalVarHandler);
  app.purge(`${adminApiPrefix}/global-vars`, purgeGlobalVarsHandler);
  app.post(`${adminApiPrefix}/global-vars/purge`, purgeGlobalVarsHandler);

  app.purge(`${adminApiPrefix}/data-buckets`, purgeDataBucketsHandler);
  app.post(`${adminApiPrefix}/data-buckets/purge`, purgeDataBucketsHandler);
};
