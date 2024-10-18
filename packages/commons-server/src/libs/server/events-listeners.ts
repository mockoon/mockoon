import {
  CloneObject,
  Environment,
  Header,
  InFlightRequest,
  InvokedCallback,
  Methods,
  Transaction
} from '@mockoon/commons';
import { format } from 'util';
import { Logger } from 'winston';
import { ServerMessages } from '../../constants/server-messages.constants';
import { MockoonServer } from './server';

const authorizationHeaders = ['authorization', 'proxy-authorization'];
const filterAuthorizationHeaders = (header: Header) => {
  if (authorizationHeaders.includes(header.key.toLowerCase())) {
    const headerSplit = header.value.split(' ');

    header.value = headerSplit.length === 1 ? '***' : `${headerSplit[0]} ***`;
  }

  return header;
};

export const listenServerEvents = function (
  server: MockoonServer,
  environment: Environment,
  logger: Logger,
  logTransaction?: boolean
): void {
  const defaultLogMeta: any = {
    environmentName: environment.name,
    environmentUUID: environment.uuid,
    app: 'mockoon-server'
  };

  server.on('started', () => {
    logger.info(format(ServerMessages.SERVER_STARTED, environment.port), {
      ...defaultLogMeta
    });

    if (process.send) {
      process.send('ready');
    }
  });

  server.on('stopped', () => {
    logger.info(ServerMessages.SERVER_STOPPED, { ...defaultLogMeta });
  });

  server.on('error', (errorCode, error, payload) => {
    const errorMeta = { ...defaultLogMeta };
    let message = '';

    switch (errorCode) {
      case 'PORT_ALREADY_USED':
        message = format(ServerMessages[errorCode], environment.port);
        break;
      case 'PORT_INVALID':
        message = format(ServerMessages[errorCode], environment.port);
        break;
      case 'HOSTNAME_UNKNOWN':
        message = format(ServerMessages[errorCode], environment.hostname);
        break;
      case 'HOSTNAME_UNAVAILABLE':
        message = format(ServerMessages[errorCode], environment.hostname);
        break;
      case 'REQUEST_BODY_PARSE':
      case 'ROUTE_CREATION_ERROR':
      case 'ROUTE_CREATION_ERROR_REGEX':
      case 'ROUTE_SERVING_ERROR':
      case 'ROUTE_FILE_SERVING_ERROR':
      case 'UNKNOWN_SERVER_ERROR':
      case 'HEADER_PARSING_ERROR':
      case 'CALLBACK_ERROR':
      case 'CALLBACK_FILE_ERROR':
      case 'WS_SERVING_ERROR':
      case 'WS_UNKNOWN_ROUTE':
      case 'WS_UNSUPPORTED_CONTENT':
        message = format(ServerMessages[errorCode], error?.message || '');
        break;
      case 'CERT_FILE_NOT_FOUND':
        message = format(ServerMessages[errorCode]);
        break;
      case 'PROXY_ERROR':
        message = format(
          ServerMessages[errorCode],
          environment.proxyHost,
          error?.message
        );
        break;
      case 'ROUTE_NO_LONGER_EXISTS':
        message = ServerMessages[errorCode];
        break;
    }

    logger.error(message, { ...errorMeta, ...payload });
  });

  server.on('creating-proxy', () => {
    logger.info(
      format(ServerMessages.SERVER_CREATING_PROXY, environment.proxyHost),
      { ...defaultLogMeta }
    );
  });

  server.on('transaction-complete', (transaction: Transaction) => {
    const logMeta: { transaction: Transaction } = {
      ...defaultLogMeta,
      requestMethod: transaction.request.method.toUpperCase(),
      requestPath: transaction.request.urlPath,
      responseStatus: transaction.response.statusCode,
      requestProxied: transaction.proxied
    };

    if (logTransaction) {
      logMeta.transaction = CloneObject(transaction) as Transaction;
      logMeta.transaction.request.headers =
        logMeta.transaction.request.headers.map(filterAuthorizationHeaders);
      logMeta.transaction.response.headers =
        logMeta.transaction.response.headers.map(filterAuthorizationHeaders);
      logMeta.transaction.request.method =
        logMeta.transaction.request.method.toUpperCase() as Methods;
    }

    logger.info('Transaction recorded', logMeta);
  });

  server.on('callback-invoked', (callback: InvokedCallback) => {
    const logMeta: { callback: InvokedCallback } = {
      ...defaultLogMeta,
      callbackName: callback.name,
      callbackMethod: callback.method,
      callbackUrl: callback.url,
      callbackStatus: callback.status
    };

    if (logTransaction) {
      const clonedCallback = CloneObject(callback) as InvokedCallback;
      logMeta.callback = clonedCallback;
      logMeta.callback.requestHeaders = logMeta.callback.requestHeaders.map(
        filterAuthorizationHeaders
      );
      logMeta.callback.responseHeaders = logMeta.callback.responseHeaders.map(
        filterAuthorizationHeaders
      );
    }
    logger.info('Callback invoked', logMeta);
  });

  server.on('ws-new-connection', (inflightRequest: InFlightRequest) => {
    const logMeta: { inflightRequest: InFlightRequest } = {
      ...defaultLogMeta,
      websocketId: inflightRequest.requestId,
      url: inflightRequest.request.urlPath,
      routeUUID: inflightRequest.routeUUID
    };

    if (logTransaction) {
      logMeta.inflightRequest = CloneObject(inflightRequest) as InFlightRequest;
      logMeta.inflightRequest.request.headers = logMeta.inflightRequest.request
        ?.headers
        ? logMeta.inflightRequest.request?.headers.map(
            filterAuthorizationHeaders
          )
        : [];
    }
    logger.info('WebSocket New Connection', logMeta);
  });

  server.on(
    'ws-message-received',
    (inflightRequest: InFlightRequest, message: string) => {
      const logMeta: { inflightRequest: InFlightRequest; messageData: string } =
        {
          ...defaultLogMeta,
          websocketId: inflightRequest.requestId,
          url: inflightRequest.request.urlPath,
          routeUUID: inflightRequest.routeUUID
        };

      if (logTransaction) {
        logMeta.inflightRequest = CloneObject(
          inflightRequest
        ) as InFlightRequest;
        logMeta.messageData = message;
        logMeta.inflightRequest.request.headers = logMeta.inflightRequest
          .request?.headers
          ? logMeta.inflightRequest.request?.headers.map(
              filterAuthorizationHeaders
            )
          : [];
      }
      logger.info('WebSocket Message Recieved', logMeta);
    }
  );

  server.on(
    'ws-closed',
    (request: InFlightRequest, code: number, reason?: string | null) => {
      const logMeta: { inflightRequest: InFlightRequest } = {
        ...defaultLogMeta,
        websocketId: request.requestId,
        code,
        reason
      };

      if (logTransaction) {
        logMeta.inflightRequest = CloneObject(request) as InFlightRequest;
        logMeta.inflightRequest.request.headers = logMeta.inflightRequest
          .request?.headers
          ? logMeta.inflightRequest.request?.headers.map(
              filterAuthorizationHeaders
            )
          : [];
      }

      logger.info('WebSocket Closed', logMeta);
    }
  );
};
