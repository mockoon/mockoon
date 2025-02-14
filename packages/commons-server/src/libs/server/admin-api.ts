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
  serverInstance: MockoonServer,
  {
    statePurgeCallback,
    getGlobalVariables,
    setGlobalVariables,
    purgeGlobalVariables,
    getDataBucket,
    getDataBuckets,
    purgeDataBuckets,
    getLogs,
    purgeLogs,
    envVarsPrefix
  }: {
    statePurgeCallback: () => void;
    getGlobalVariables: (key: string) => any;
    setGlobalVariables: (key: string, value: any) => void;
    purgeGlobalVariables: () => void;
    getDataBucket: (nameOrId: string) => any;
    getDataBuckets: () => any;
    purgeDataBuckets: () => void;
    getLogs: () => Transaction[];
    purgeLogs: () => void;
    envVarsPrefix: string;
  }
): void => {
  const adminApiPrefix = '/mockoon-admin';
  const events = new Sse();

  app.get(adminApiPrefix, (req, res) => {
    res.send({
      response:
        "Welcome to Mockoon's admin API. Check the documentation at https://mockoon.com/docs/latest/admin-api/overview/ for more information."
    });
  });

  app.get(`${adminApiPrefix}/events`, events.requestListener);

  serverInstance.on('stopped', () => {
    events.close();
  });

  // listen to server events and send them through the SSE
  serverInstance.on('transaction-complete', (transaction) => {
    events.send({ event: 'transaction-complete', transaction });
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

  /**
   * Get the value of an environment variable
   *
   * @param req
   * @param res
   */
  const getEnvVarHandler = (req, res) => {
    // get var name from path
    let varName = req.params.key;

    if (!varName.startsWith(envVarsPrefix)) {
      varName = envVarsPrefix + varName;
    }

    if (varName) {
      // send var or 404
      if (process.env[varName] !== undefined) {
        res.send({
          key: varName,
          value: process.env[varName]
        });
      } else {
        res.status(404).send({ message: 'Environment variable not found' });
      }
    } else {
      res.status(400).send({ message: 'Invalid request' });
    }
  };

  /**
   * Set the value of an environment variable
   *
   * @param req
   * @param res
   */
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
    } catch (_error) {
      res.status(400).send({ message: 'Invalid request' });
    }
  };

  /**
   * Get the value of a global variable
   *
   * @param req
   * @param res
   */
  const getGlobalVarHandler = (req, res) => {
    // get var name from path
    const key = req.params.key;

    if (key) {
      // send var or 404
      if (getGlobalVariables(key) !== undefined) {
        res.send({
          key,
          value: getGlobalVariables(key)
        });
      } else {
        res.status(404).send({ message: 'Global variable not found' });
      }
    } else {
      res.status(400).send({ message: 'Invalid request' });
    }
  };

  /**
   * Set the value of a global variable
   *
   * @param req
   * @param res
   */
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
    } catch (_error) {
      res.status(400).send({ message: 'Invalid request' });
    }
  };

  /**
   * Trigger the purge of global variables, deleting all of them
   *
   * @param req
   * @param res
   */
  const purgeGlobalVarsHandler = (req, res) => {
    try {
      purgeGlobalVariables();
      res.send({
        message: 'Global variables have been purged'
      });
    } catch (_error) {
      res.status(500).send({ message: 'Failed to purge global variables' });
    }
  };

  /**
   * Get data buckets current states (without value)
   *
   * @param req
   * @param res
   */
  const getDataBucketsHandler = (req, res) => {
    const buckets = getDataBuckets();

    res.send(
      buckets.map((bucket) => ({
        id: bucket.id,
        name: bucket.name,
        parsed: bucket.parsed,
        validJson: bucket.validJson
      }))
    );
  };

  /**
   * Get a data bucket current parsed value
   *
   * @param req
   * @param res
   */
  const getDataBucketHandler = (req, res) => {
    const nameOrId = req.params.nameOrId;

    if (nameOrId) {
      const bucket = getDataBucket(nameOrId);

      if (bucket) {
        res.send(bucket);
      } else {
        res.status(404).send({ message: 'Data bucket not found' });
      }
    } else {
      res.status(400).send({ message: 'Invalid request' });
    }
  };

  /**
   * Trigger the purge of data buckets, resetting them to their initial state
   *
   * @param req
   * @param res
   */
  const purgeDataBucketsHandler = (req, res) => {
    try {
      purgeDataBuckets();
      res.send({
        message: 'Data buckets have been reset to their initial state'
      });
    } catch (_error) {
      res.status(500).send({ message: 'Failed to reset the data buckets' });
    }
  };

  /**
   * Return the transaction logs with pagination.
   * This is similar to the desktop app's Logs tab information.
   *
   * @param req
   * @param res
   */
  const getLogsHandler = (req: Request, res: Response) => {
    const page =
      typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
    const limit =
      typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 10;
    const logs = getLogs();
    const start = (page - 1) * limit;

    res.send(logs.slice(start, start + limit));
  };

  /**
   * Trigger the purge of transaction logs, deleting all of them
   *
   * @param req
   * @param res
   */
  const purgeLogsHandler = (req, res) => {
    try {
      purgeLogs();
      res.send({
        message: 'Logs have been purged'
      });
    } catch (_error) {
      res.status(500).send({ message: 'Failed to purge logs' });
    }
  };

  // global state endpoints
  app.purge(stateEndpoint, purgeHandler);
  app.post(`${stateEndpoint}/purge`, purgeHandler);

  // Logs endpoints
  app.get(`${adminApiPrefix}/logs`, getLogsHandler);
  app.post(`${adminApiPrefix}/logs/purge`, purgeLogsHandler);
  app.purge(`${adminApiPrefix}/logs`, purgeLogsHandler);

  // env vars endpoints
  app.get(`${adminApiPrefix}/env-vars/:key`, getEnvVarHandler);
  app.post(`${adminApiPrefix}/env-vars`, setEnvVarHandler);
  app.put(`${adminApiPrefix}/env-vars`, setEnvVarHandler);
  app.patch(`${adminApiPrefix}/env-vars`, setEnvVarHandler);

  // global vars endpoints
  app.get(`${adminApiPrefix}/global-vars/:key`, getGlobalVarHandler);
  app.post(`${adminApiPrefix}/global-vars`, setGlobalVarHandler);
  app.put(`${adminApiPrefix}/global-vars`, setGlobalVarHandler);
  app.patch(`${adminApiPrefix}/global-vars`, setGlobalVarHandler);
  app.purge(`${adminApiPrefix}/global-vars`, purgeGlobalVarsHandler);
  app.post(`${adminApiPrefix}/global-vars/purge`, purgeGlobalVarsHandler);

  // data buckets endpoints
  app.get(`${adminApiPrefix}/data-buckets`, getDataBucketsHandler);
  app.get(`${adminApiPrefix}/data-buckets/:nameOrId`, getDataBucketHandler);
  app.purge(`${adminApiPrefix}/data-buckets`, purgeDataBucketsHandler);
  app.post(`${adminApiPrefix}/data-buckets/purge`, purgeDataBucketsHandler);
};
