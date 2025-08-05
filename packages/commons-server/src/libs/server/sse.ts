import { Request, Response } from 'express';
import { EventEmitter } from 'node:events';

export class Sse {
  private eventEmitter = new EventEmitter();
  private activeListenerCount = 0;

  constructor(
    private options: {
      keepAlive?: boolean;
      keepAliveDelay?: number;
      getInitialEvents?: (request: Request) => any[];
    } = {
      keepAlive: true,
      keepAliveDelay: 60000
    }
  ) {
    this.options = {
      ...{
        keepAlive: true,
        keepAliveDelay: 60000
      },
      ...options
    };

    this.eventEmitter.setMaxListeners(30);
  }

  public requestListener = (request: Request, response: Response) => {
    request.socket.setTimeout(0);
    request.socket.setNoDelay(true);
    request.socket.setKeepAlive(true);

    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    response.flushHeaders();

    const listener = (data: any) => {
      response.write(`data: ${JSON.stringify(data)}\n\n`);
      response.flushHeaders();
    };

    this.eventEmitter.on('message', listener);
    this.activeListenerCount++;

    // get and send initial messages
    if (this.options.getInitialEvents) {
      const initialMessages = this.options.getInitialEvents(request);

      initialMessages.forEach((data) => {
        this.eventEmitter.emit('message', data);
      });
    }

    if (this.options.keepAlive) {
      const keepAliveInterval = setInterval(() => {
        response.write(':\n\n');
      }, this.options.keepAliveDelay);

      response.once('close', () => {
        clearInterval(keepAliveInterval);
      });
    }

    response.once('close', () => {
      response.end();
      this.eventEmitter.off('message', listener);
      this.activeListenerCount--;
    });
  };

  public send(data: any) {
    if (this.activeListenerCount > 0) {
      this.eventEmitter.emit('message', data);
    }
  }

  public close() {
    this.eventEmitter.removeAllListeners('message');
  }
}
