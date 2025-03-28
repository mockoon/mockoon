import { Request, Response } from 'express';
import { EventEmitter } from 'node:events';

export class Sse {
  private eventEmitter = new EventEmitter();
  private messageQueue: any[] = [];
  private replayableMessageQueue: any[] = [];
  private activeListenerCount = 0;

  constructor(
    private options: { keepAlive?: boolean; keepAliveDelay?: number } = {
      keepAlive: true,
      keepAliveDelay: 60000
    }
  ) {
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

    // Send any queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.eventEmitter.emit('message', message);
    }

    // Send replayable messages
    this.replayableMessageQueue.forEach((message) => {
      this.eventEmitter.emit('message', message);
    });

    // keep alive
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

  public send(data: any, replayable = false) {
    if (replayable) {
      this.replayableMessageQueue.push(data);
    }

    if (this.activeListenerCount > 0) {
      this.eventEmitter.emit('message', data);
    } else if (!replayable && this.activeListenerCount === 0) {
      this.messageQueue.push(data);
    }
  }

  public close() {
    this.eventEmitter.removeAllListeners('message');
    this.messageQueue = [];
    this.replayableMessageQueue = [];
  }
}
