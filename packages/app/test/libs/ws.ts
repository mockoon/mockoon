import { WebSocket } from 'ws';

export function withTimeout(
  millis: number,
  promise: Promise<any>
): Promise<any> {
  const timeout = new Promise<any>((_resolve, reject) =>
    setTimeout(() => reject(`Timed out after ${millis} ms.`), millis)
  );

  return Promise.race([promise, timeout]);
}

type WsWsgRecord = {
  time: number;
  message: string;
};

export class WsConnection {
  private ws: WebSocket;
  private messageArray: WsWsgRecord[] = [];
  private msgCallback: (err?: Error, msg?: string) => void;
  constructor(
    private port: number,
    private path = '',
    private protocol = 'ws'
  ) {}

  public async open(openWithData?: string, headers?: any) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(
        `${this.protocol}://localhost:${this.port}${this.path}`,
        {
          headers,
          handshakeTimeout: 5000
        }
      );

      this.ws.on('message', (data) => {
        this.messageArray.push({
          message: data.toString('utf8'),
          time: Date.now()
        });
      });

      if (openWithData) {
        this.ws.on('open', () => {
          this.ws.send(openWithData, (err) => {
            if (err) {
              reject();
            } else {
              resolve({});
            }
          });
        });
      } else {
        resolve({});
      }
    });
  }

  public async openForConversation(headers?: any) {
    return new Promise((resolve) => {
      this.ws = new WebSocket(
        `${this.protocol}://localhost:${this.port}${this.path}`,
        {
          headers,
          handshakeTimeout: 5000,
          timeout: 5000,
          rejectUnauthorized: false
        }
      );

      this.ws.on('message', (data) => {
        if (this.msgCallback) {
          this.msgCallback(undefined, data.toString('utf8'));
        }
      });

      this.ws.on('error', (err) => {
        if (this.msgCallback) {
          this.msgCallback(err);
        }
      });

      this.ws.on('open', () => {
        resolve({});
      });
    });
  }

  public assertHasAtLeastNoOfMessages(num: number) {
    expect(this.messageArray.length).toBeGreaterThanOrEqual(num);
  }

  public drainAllMessages() {
    const tmp = [...this.messageArray]
      .sort((a, b) => a.time - b.time)
      .map((a) => a.message);
    this.messageArray = [];

    return tmp;
  }

  public assertWebsocketIsOpened() {
    expect(
      this.ws.readyState === this.ws.OPEN ||
        this.ws.readyState === this.ws.CONNECTING
    ).toBeTruthy();
  }

  public assertWebsocketIsClosed() {
    expect(
      this.ws.readyState === this.ws.CLOSING ||
        this.ws.readyState === this.ws.CLOSED
    ).toBeTruthy();
  }

  public async assertReply(dataRequest: string, expected: string) {
    const data = await this.sendAndGet(dataRequest);
    expect(data).toEqual(expected);
  }

  public async sendAndGet(dataRequest: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.messageArray = [];

      const cb = (err?: Error, msg?: string) => {
        if (err) {
          reject(err);
        } else {
          resolve(msg);
        }
      };
      this.msgCallback = cb;

      this.ws.send(dataRequest, (err) => {
        if (err) {
          reject(err);
        }
      });
    });
  }

  public close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
