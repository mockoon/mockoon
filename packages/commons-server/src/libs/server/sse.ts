import { Request, Response } from 'express';
import { EventEmitter } from 'node:events';

export class Sse {
  private eventEmitter = new EventEmitter();

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
    };

    this.eventEmitter.on('message', listener);

    response.once('close', () => {
      response.write(`data: closing\n\n`);
      response.end();
      this.eventEmitter.off('message', listener);
    });
  };

  public send(data: any) {
    this.eventEmitter.emit('message', data);
  }

  public close() {
    this.eventEmitter.removeAllListeners('message');
  }
}
