import {
  Environment,
  ProcessedDatabucket,
  Route,
  RouteResponse,
  ServerErrorCodes,
  ServerEvents
} from '@mockoon/commons';
import { readFile } from 'fs';
import TypedEventEmitter from 'typed-emitter';
import { RawData, WebSocket } from 'ws';
import { ServerRequest } from '../requests';
import { ResponseRulesInterpreter } from '../response-rules-interpreter';

export const SMALLEST_POSSIBLE_STREAMING_INTERVAL = 10;

export type DelegatedTemplateParser = (content: string) => string;

export type DelegatedBroadcastHandler = (
  responseNumber: number,
  enabledRouteResponse: RouteResponse
) => void;

export type ServerContext = {
  environment: Environment;
  processedDatabuckets: ProcessedDatabucket[];
  globalVariables: Record<string, any>;
  envVarPrefix: string;
};

/**
 * Returns a safe streaming interval for one-to-one and broadcast websockets.
 * Having a small interval could make server potentially unusable.
 */
export const getSafeStreamingInterval = (givenInterval: number): number =>
  Math.max(SMALLEST_POSSIBLE_STREAMING_INTERVAL, givenInterval);

/**
 * Represents a single running streaming data for a route.
 * For all socket clients, there will be only one single instance.
 */
export class WsRunningInstance {
  private closeable: NodeJS.Timeout;
  private running = false;
  constructor(
    private route: Route,
    private serverContext: ServerContext,
    private serverRequest: ServerRequest,
    private handler: DelegatedBroadcastHandler
  ) {}

  public get _isRunning(): boolean {
    return this.running;
  }

  public run() {
    let responseNumber = 1;

    this.closeable = setInterval(() => {
      const enabledRouteResponse = new ResponseRulesInterpreter(
        this.route.responses,
        this.serverRequest,
        this.route.responseMode,
        this.serverContext.environment,
        this.serverContext.processedDatabuckets,
        this.serverContext.globalVariables,
        this.serverContext.envVarPrefix
      ).chooseResponse(responseNumber);

      if (!enabledRouteResponse) {
        return;
      }

      responseNumber += 1;

      this.handler(responseNumber, enabledRouteResponse);
    }, getSafeStreamingInterval(this.route.streamingInterval));

    this.running = true;
  }

  public close() {
    if (this.closeable) {
      clearInterval(this.closeable);
      this.running = false;
    }
  }
}

/**
 * Context for all websocket broadcast end points.
 * This class holds all streaming data generators per route.
 * This guarantees that it creates one and only generator for a given route.
 */
export class BroadcastContext {
  private static context: BroadcastContext;

  private readonly routeDataGenerators: Map<string, WsRunningInstance> =
    new Map<string, WsRunningInstance>();

  public get _runningInstances(): Set<string> {
    return new Set<string>(this.routeDataGenerators.keys());
  }

  public static getInstance(): BroadcastContext {
    if (!BroadcastContext.context) {
      BroadcastContext.context = new BroadcastContext();
    }

    return BroadcastContext.context;
  }

  public registerRoute(
    route: Route,
    serverContext: ServerContext,
    serverRequest: ServerRequest,
    nextResponseHandler: DelegatedBroadcastHandler
  ): boolean {
    const ref = this.routeDataGenerators.get(route.endpoint);
    if (ref) {
      // A reference already exists. So, broadcasting will be done by it.
      // No need to create another.
      return false;
    }

    const instance = new WsRunningInstance(
      route,
      serverContext,
      serverRequest,
      nextResponseHandler
    );
    this.routeDataGenerators.set(route.endpoint, instance);
    instance.run();

    return true;
  }

  /**
   * This will close all running contexts.
   */
  public closeAll() {
    this.routeDataGenerators.forEach((runner) => {
      runner.close();
    });
    this.routeDataGenerators.clear();
  }

  public closeRoute(route: Route) {
    const ref = this.routeDataGenerators.get(route.endpoint);
    if (ref) {
      this.routeDataGenerators.delete(route.endpoint);
      ref.close();
    }
  }
}

/**
 * Convert incoming websocket message to string representation.
 *
 * @param message
 */
export const messageToString = (message?: RawData): string => {
  if (!message) {
    return '';
  }
  if (Array.isArray(message)) {
    return Buffer.concat(message).toString('utf8');
  }

  return message.toString('utf8');
};

/**
 * Returns true if the given socket client is still in open state.
 *
 * @param socket
 */
export const isWebSocketOpen = (socket: WebSocket): boolean =>
  socket.readyState === WebSocket.OPEN;

/**
 * Serve the content of the file as a response.
 * Will use templating if specified to do so.
 *
 * @param socket
 * @param route
 * @param routeResponse
 * @param eventEmitter
 * @param filePath
 * @param templateParser
 */
export const serveFileContentInWs = (
  socket: WebSocket,
  route: Route,
  routeResponse: RouteResponse,
  eventEmitter: TypedEventEmitter<ServerEvents>,
  filePath: string,
  templateParser: DelegatedTemplateParser
) => {
  readFile(filePath, (err, fileData) => {
    if (err) {
      eventEmitter.emit(
        'error',
        ServerErrorCodes.ROUTE_FILE_SERVING_ERROR,
        err,
        {
          routePath: route.endpoint,
          routeUUID: route.uuid
        }
      );

      // we close the socket if the provided file cannot be read.
      socket.send(`Status: 500, File reading error! (${err.message})`, () => {
        socket.close();
      });
    } else {
      let fileContent = fileData.toString();
      if (!routeResponse.disableTemplating) {
        fileContent = templateParser(fileContent);
      }

      socket.send(fileContent);
    }
  });
};
