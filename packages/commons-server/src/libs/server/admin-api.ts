import {
  Environment,
  EnvironmentSchema,
  extractBearerToken,
  Transaction
} from '@mockoon/commons';
import { Express, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { redactTransaction } from '../utils';
import { MockoonServer } from './server';
import { Sse } from './sse';

/**
 * Creates the Admin API endpoints
 * Documentation: https://mockoon.com/docs/latest/admin-api/overview/ *
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
    envVarsPrefix,
    adminApiAuthToken,
    adminApiCorsOrigins,
    updateEnvironment
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
    adminApiAuthToken: string;
    adminApiCorsOrigins?: string[];
    updateEnvironment: (environment: Environment) => void;
  }
): void => {
  const replayableEvents: any[] = [];
  const adminApiPrefix = '/mockoon-admin';
  const events = new Sse({
    getInitialEvents: (request: Request) => {
      const maxLogs =
        typeof request.query['maxlogs'] === 'string'
          ? parseInt(request.query['maxlogs'], 10)
          : undefined;
      const logs = getLogs();
      const limitedLogs =
        maxLogs != null && !isNaN(maxLogs) && maxLogs > 0
          ? logs.slice(maxLogs * -1)
          : logs;

      return [
        ...replayableEvents,
        ...limitedLogs.map((transaction) => ({
          event: 'transaction-complete',
          transaction: redactTransaction(transaction)
        }))
      ];
    }
  });

  app.use(`${adminApiPrefix}*`, (req, res, next) => {
    const allowedOrigins = adminApiCorsOrigins ?? [];
    const allowAll = allowedOrigins.includes('*');
    const requestOrigin = req.get('origin');
    const matchedOrigin = allowAll
      ? '*'
      : requestOrigin && allowedOrigins.includes(requestOrigin)
        ? requestOrigin
        : undefined;

    if (matchedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', matchedOrigin);
      if (matchedOrigin !== '*') {
        res.setHeader('Vary', 'Origin');
      }
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS'
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Origin, Accept, Authorization, Content-Length, X-Requested-With'
      );
    }

    if (req.method === 'OPTIONS') {
      // Always terminate preflight at the admin endpoint to avoid leaking
      // to user-defined routes. Browsers will reject the response if no
      // matching Access-Control-Allow-Origin header is present.
      res.status(matchedOrigin ? 204 : 403).end();

      return;
    }

    next();
  });

  const adminApiUnauthorized = (res: Response) => {
    res.status(401).send({ message: 'Unauthorized' });
  };

  const hasValidAdminApiToken = (providedToken: string): boolean => {
    const expectedTokenBuffer = Buffer.from(adminApiAuthToken, 'utf8');
    const providedTokenBuffer = Buffer.from(providedToken, 'utf8');

    if (expectedTokenBuffer.length !== providedTokenBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedTokenBuffer, providedTokenBuffer);
  };

  app.use(`${adminApiPrefix}*`, (req: Request, res: Response, next) => {
    if (req.method === 'OPTIONS') {
      next();

      return;
    }

    const isSseEndpoint =
      req.method === 'GET' && req.baseUrl === `${adminApiPrefix}/events`;
    const bearerToken = extractBearerToken(req.get('authorization'));
    const sseQueryToken =
      isSseEndpoint && typeof req.query['token'] === 'string'
        ? req.query['token'].trim()
        : undefined;
    const providedToken = bearerToken || sseQueryToken;

    if (!providedToken || !hasValidAdminApiToken(providedToken)) {
      adminApiUnauthorized(res);

      return;
    }

    next();
  });

  app.get(adminApiPrefix, (req, res) => {
    res.send({
      response:
        "Welcome to Mockoon's admin API. Check the documentation at https://mockoon.com/docs/latest/admin-api/overview/ for more information."
    });
  });

  serverInstance.on('stopped', () => {
    events.close();
  });

  // listen to server events and send them through the SSE
  serverInstance.on('transaction-complete', (transaction) => {
    const event = {
      event: 'transaction-complete',
      transaction: redactTransaction(transaction)
    };

    events.send(event);
  });

  serverInstance.on('data-bucket-processed', (dataBuckets) => {
    const event = { event: 'data-bucket-processed', dataBuckets };

    events.send(event);
    replayableEvents.push(event);
  });

  app.get(`${adminApiPrefix}/events`, events.requestListener);

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
   * Set the value of an environment variable.
   *
   * The key must start with the configured prefix to prevent arbitrary
   * environment variable writes (e.g. PATH, NODE_OPTIONS). If the key
   * does not start with the prefix, it is automatically prepended,
   * mirroring the read handler behavior.
   *
   * When the prefix is empty, writes are rejected to avoid arbitrary
   * environment variable writes.
   *
   * @param req
   * @param res
   */
  const setEnvVarHandler = (req, res) => {
    try {
      const { key, value } = req.body;
      if (key === undefined || value === undefined) {
        throw new Error('Key or value missing from request');
      }

      if (!envVarsPrefix) {
        res.status(403).send({
          message:
            'Environment variable writes are disabled when the prefix is empty'
        });

        return;
      }

      const prefixedKey = key.startsWith(envVarsPrefix)
        ? key
        : envVarsPrefix + key;

      process.env[prefixedKey] = value;

      res.send({
        message: `Environment variable '${prefixedKey}' has been set to '${value}'`
      });
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
      typeof req.query['page'] === 'string'
        ? parseInt(req.query['page'], 10)
        : 1;
    const limit =
      typeof req.query['limit'] === 'string'
        ? parseInt(req.query['limit'], 10)
        : 10;
    const logs = getLogs();
    const start = (page - 1) * limit;

    res.send(logs.slice(start, start + limit).map(redactTransaction));
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

  /**
   * Update the environment
   *
   * Note: not everything can be updated during runtime, only:
   * - some environment properties (headers, proxy headers, latency, etc.)
   * - route responses (headers, latency, status code, etc.)
   * - some route properties (response mode)
   *
   * What cannot be updated:
   * - route paths and methods
   * - environment port, hostname, and proxy target
   * - adding or removing routes
   * - data buckets
   * - callbacks
   */
  app.put(`${adminApiPrefix}/environment`, (req, res) => {
    try {
      const environment: Environment = EnvironmentSchema.validate(
        req.body
      ).value;

      if (!environment) {
        res.status(400).send({ message: 'Invalid environment format' });

        return;
      }

      updateEnvironment(environment);

      res.send({
        message: 'Environment updated'
      });
    } catch (_error) {
      res.status(400).send({ message: 'Invalid environment format' });
    }
  });
};
