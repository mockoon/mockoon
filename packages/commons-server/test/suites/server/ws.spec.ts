import {
  BodyTypes,
  Environment,
  ResponseMode,
  Route,
  RouteResponse
} from '@mockoon/commons';
import { ok, strictEqual } from 'assert';
import { IncomingMessage } from 'http';
import { fromWsRequest } from '../../../src/libs/requests';
import {
  BroadcastContext,
  DelegatedBroadcastHandler,
  SMALLEST_POSSIBLE_STREAMING_INTERVAL,
  ServerContext,
  WsRunningInstance,
  getSafeStreamingInterval
} from '../../../src/libs/server/ws';

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({});
    }, ms);
  });

const EMPTY_SERVER_CTX = {
  environment: {} as Environment,
  globalVariables: {},
  processedDatabuckets: [],
  envVarPrefix: ''
} as ServerContext;

const EMPTY_WS_REQUEST = fromWsRequest({} as IncomingMessage);

describe('Minimum Streaming Interval', () => {
  it('minimum interval should not lower than 10ms', () => {
    strictEqual(
      getSafeStreamingInterval(0),
      SMALLEST_POSSIBLE_STREAMING_INTERVAL
    );
    strictEqual(
      getSafeStreamingInterval(-100),
      SMALLEST_POSSIBLE_STREAMING_INTERVAL
    );
    strictEqual(
      getSafeStreamingInterval(9),
      SMALLEST_POSSIBLE_STREAMING_INTERVAL
    );
    strictEqual(getSafeStreamingInterval(10), 10);
    strictEqual(getSafeStreamingInterval(11), 11);
    strictEqual(getSafeStreamingInterval(500), 500);
    strictEqual(getSafeStreamingInterval(1000), 1000);
  });
});

describe('WS Streaming Runner', () => {
  const assertIsRunning = (runner: WsRunningInstance) =>
    strictEqual(runner._isRunning, true);
  const assertNotRunning = (runner: WsRunningInstance) =>
    strictEqual(runner._isRunning, false);

  it('should not fail if close() is called before start or repeatedly afterwards', async () => {
    const received = [] as string[];
    const handler: DelegatedBroadcastHandler = (
      _: number,
      routeResponse: RouteResponse
    ) => {
      received.push(routeResponse.body || '');
    };
    const route = {
      endpoint: '/api/test1',
      responses: [
        { bodyType: BodyTypes.INLINE, body: 'test 1' },
        { bodyType: BodyTypes.INLINE, body: 'test 2' },
        { bodyType: BodyTypes.INLINE, body: 'test 3' }
      ],
      responseMode: ResponseMode.SEQUENTIAL,
      streamingInterval: 10
    } as Route;

    const runner = new WsRunningInstance(
      route,
      EMPTY_SERVER_CTX,
      EMPTY_WS_REQUEST,
      handler
    );

    assertNotRunning(runner);
    runner.close();
    assertNotRunning(runner);

    // start and wait
    runner.run();
    assertIsRunning(runner);
    await sleep(200);
    assertIsRunning(runner);

    ok(received.length > 0);

    // close and check
    runner.close();
    assertNotRunning(runner);
    runner.close();
    assertNotRunning(runner);
  });

  it('should be able to start after close() is called', async () => {
    const received = [] as string[];
    const handler: DelegatedBroadcastHandler = (
      _: number,
      routeResponse: RouteResponse
    ) => {
      received.push(routeResponse.body || '');
    };
    const route = {
      endpoint: '/api/test1',
      responses: [
        { bodyType: BodyTypes.INLINE, body: 'test 1' },
        { bodyType: BodyTypes.INLINE, body: 'test 2' },
        { bodyType: BodyTypes.INLINE, body: 'test 3' }
      ],
      responseMode: ResponseMode.SEQUENTIAL,
      streamingInterval: 10
    } as Route;

    const runner = new WsRunningInstance(
      route,
      EMPTY_SERVER_CTX,
      EMPTY_WS_REQUEST,
      handler
    );

    assertNotRunning(runner);

    // start and wait
    runner.run();
    await sleep(200);
    assertIsRunning(runner);

    ok(received.length > 0);

    // close and check
    runner.close();

    // run again
    const prevLength = received.length;
    runner.run();
    await sleep(150);
    assertIsRunning(runner);

    runner.close();
    ok(prevLength < received.length);
    assertNotRunning(runner);
  });
});

describe('Broadcast Context', () => {
  it('should be able to register a route and should never register twice', async () => {
    const brdCtx = BroadcastContext.getInstance();
    const received = [] as string[];
    const handler: DelegatedBroadcastHandler = (
      _: number,
      routeResponse: RouteResponse
    ) => {
      received.push(routeResponse.body || '');
    };
    const route = {
      endpoint: '/api/test1',
      responses: [
        { bodyType: BodyTypes.INLINE, body: 'test 1' },
        { bodyType: BodyTypes.INLINE, body: 'test 2' },
        { bodyType: BodyTypes.INLINE, body: 'test 3' }
      ],
      responseMode: ResponseMode.SEQUENTIAL,
      streamingInterval: 20
    } as Route;

    strictEqual(brdCtx._runningInstances.size, 0);
    const added = brdCtx.registerRoute(
      route,
      EMPTY_SERVER_CTX,
      EMPTY_WS_REQUEST,
      handler
    );

    ok(added);
    strictEqual(brdCtx._runningInstances.size, 1);

    // adding again should be unsuccessful
    strictEqual(
      brdCtx.registerRoute(route, EMPTY_SERVER_CTX, EMPTY_WS_REQUEST, handler),
      false
    );
    strictEqual(brdCtx._runningInstances.size, 1);

    await sleep(100);

    brdCtx.closeAll();
    strictEqual(brdCtx._runningInstances.size, 0);
  });

  it('should be able to register route again after closing previous runners', async () => {
    const brdCtx = BroadcastContext.getInstance();
    const received = [] as string[];
    const handler: DelegatedBroadcastHandler = (
      _: number,
      routeResponse: RouteResponse
    ) => {
      received.push(routeResponse.body || '');
    };
    const route = {
      endpoint: '/api/test1',
      responses: [
        { bodyType: BodyTypes.INLINE, body: 'test 1' },
        { bodyType: BodyTypes.INLINE, body: 'test 2' },
        { bodyType: BodyTypes.INLINE, body: 'test 3' }
      ],
      responseMode: ResponseMode.SEQUENTIAL,
      streamingInterval: 20
    } as Route;

    strictEqual(brdCtx._runningInstances.size, 0);
    ok(
      brdCtx.registerRoute(route, EMPTY_SERVER_CTX, EMPTY_WS_REQUEST, handler)
    );

    await sleep(100);

    brdCtx.closeAll();
    strictEqual(brdCtx._runningInstances.size, 0);

    ok(
      brdCtx.registerRoute(route, EMPTY_SERVER_CTX, EMPTY_WS_REQUEST, handler)
    );

    brdCtx.closeAll();
    strictEqual(brdCtx._runningInstances.size, 0);
  });
});
