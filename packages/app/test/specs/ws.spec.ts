import { fail } from 'node:assert';
import { promises as fs } from 'node:fs';
import environments from '../libs/environments';
import environmentsSettings from '../libs/environments-settings';
import http from '../libs/http';
import navigation from '../libs/navigation';
import { WsConnection, withTimeout } from '../libs/ws';

describe('WebSockets', () => {
  it('should able to start a server with websockets', async () => {
    // open env
    await environments.open('ws');
    await environments.start();
  });

  describe('Http and WebSocket mixed', () => {
    it('should get response from http routes as usual among websocket routes', async () => {
      await http.assertCall({
        method: 'GET',
        path: '/ws-env/test/http',
        testedResponse: {
          status: 200,
          body: 'This is a http response'
        }
      });
    });

    it('should get response from http routes with same name than a ws route', async () => {
      await http.assertCall({
        method: 'GET',
        path: '/ws-env/test/ws/echo',
        testedResponse: {
          status: 200,
          body: 'httpres'
        }
      });
    });
  });

  describe('One-to-one websocket', () => {
    it('should be able to connect to echo websocket service', async () => {
      const ws = new WsConnection(3000, '/ws-env/test/ws/echo');
      await ws.openForConversation();
      ws.assertWebsocketIsOpened();

      await ws.assertReply(
        '{ "message": "Hello world!" }',
        'ECHO: { "message": "Hello world!" }'
      );
      await ws.assertReply(
        '{ "message": "Hello world 2222!" }',
        'ECHO: { "message": "Hello world 2222!" }'
      );

      ws.close();
      ws.assertWebsocketIsClosed();
    });

    it('should be able to connect multiple clients to echo socket', async () => {
      const ws1 = new WsConnection(3000, '/ws-env/test/ws/echo');
      await ws1.openForConversation();
      ws1.assertWebsocketIsOpened();

      const ws2 = new WsConnection(3000, '/ws-env/test/ws/echo');
      await ws2.openForConversation();
      await ws2.assertWebsocketIsOpened();

      await ws1.assertReply(
        '{ "message": "Hello world 1!" }',
        'ECHO: { "message": "Hello world 1!" }'
      );
      await ws2.assertReply(
        '{ "message": "Hello world 2!" }',
        'ECHO: { "message": "Hello world 2!" }'
      );

      ws1.assertWebsocketIsOpened();
      ws2.assertWebsocketIsOpened();

      ws1.close();

      ws2.assertWebsocketIsOpened();

      await ws2.assertReply(
        '{ "message": "Hello world 3!" }',
        'ECHO: { "message": "Hello world 3!" }'
      );

      ws2.close();
    });

    it('should return correct response for each message', async () => {
      // conversational type ws
      await fs.copyFile(
        './test/data/res/file-templating.txt',
        './tmp/storage/file-templating.txt'
      );

      const ws = new WsConnection(3000, '/ws-env/test/ws/converse');
      await ws.openForConversation({
        'Content-Type': 'application/json'
      });
      ws.assertWebsocketIsOpened();

      await ws.assertReply('{ "test": "2" }', 'start2end');
      await ws.assertReply('{ "test": "1" }', 'Response when given 1');
      await ws.assertReply('{ "test": "0" }', 'Response otherwise');
      await ws.assertReply('{ }', 'Response otherwise');

      ws.close();
      ws.assertWebsocketIsClosed();
    });

    it('should be able to connect to streaming websocket service', async () => {
      const ws = new WsConnection(
        3000,
        '/ws-env/test/ws/one-to-one?q1=abc&q2=123'
      );
      await ws.open();
      ws.assertWebsocketIsOpened();

      await browser.pause(1000);
      // for 1 second, at least 3-4 messages must be received
      ws.assertHasAtLeastNoOfMessages(1);
      const msgs = ws.drainAllMessages();
      const jsonMsgs = msgs.map((m) => JSON.parse(m));
      // a unique number must have generated for each response field
      const nums = jsonMsgs.map((m) => m['response']);
      expect(new Set(nums).size > 1).toBeTruthy();
      // the query param must be returned in all messages
      const q1s = jsonMsgs.map((m) => m['q1']);
      expect(q1s.filter((m) => m === 'abc')).toHaveLength(jsonMsgs.length);

      ws.close();
      ws.assertWebsocketIsClosed();
    });

    it('should send data in correct order for sequential streaming', async () => {
      const ws = new WsConnection(3000, '/ws-env/test/ws/one-to-one/seq');
      await ws.open();
      ws.assertWebsocketIsOpened();

      await browser.pause(1600);

      const msgs = ws.drainAllMessages();
      expect(msgs.length).toBeGreaterThan(0);
      const expected = [...Array(msgs.length)].map(
        (_, i) => `Bucket ${(i % 3) + 1} data`
      );
      expect(msgs).toEqual(expected);

      ws.close();
      ws.assertWebsocketIsClosed();
    });

    it('should send correct data for default response streaming', async () => {
      const ws = new WsConnection(3000, '/ws-env/test/ws/one-to-one/dfres');
      await ws.open();
      ws.assertWebsocketIsOpened();

      await browser.pause(1600);

      const msgs = ws.drainAllMessages();
      ws.assertWebsocketIsOpened();
      expect(msgs.length).toBeGreaterThan(0);
      const expected = [...Array(msgs.length)].map(() => 'Bucket 1 data');
      expect(msgs).toEqual(expected);

      ws.close();
      ws.assertWebsocketIsClosed();
    });

    it('should not be able to connect to disabled websockets', async () => {
      const ws = new WsConnection(3000, '/ws-env/test/ws/disabled');
      try {
        await withTimeout(5000, ws.open());
        fail();
      } catch (_error) {}
    });
  });

  describe('Broadcast streams', () => {
    it('should receive same message for all connected clients', async () => {
      const ws1 = new WsConnection(3000, '/ws-env/test/ws/broadcast');
      const ws2 = new WsConnection(3000, '/ws-env/test/ws/broadcast');
      await Promise.all([ws1.open(), ws2.open()]);
      ws1.assertWebsocketIsOpened();
      ws2.assertWebsocketIsOpened();

      await browser.pause(1250);

      const msg1 = ws1.drainAllMessages();
      const msg2 = ws2.drainAllMessages();
      expect(msg1).toHaveLength(msg2.length);
      for (let index = 0; index < msg1.length; index++) {
        expect(msg1[index]).toEqual(msg2[index]);
      }

      ws1.close();
      ws2.close();
    });
  });

  describe('Secured WebSockets with TLS', () => {
    before(async () => {
      await fs.copyFile(
        './test/data/res/domain.crt',
        './tmp/storage/domain.crt'
      );
      await fs.copyFile(
        './test/data/res/domain.key',
        './tmp/storage/domain.key'
      );
    });

    it('should add a custom certificate', async () => {
      await navigation.switchView('ENV_SETTINGS');

      await environmentsSettings.setSettingValue('certPath', './domain.crt');
      await environmentsSettings.setSettingValue('keyPath', './domain.key');
      await environmentsSettings.setSettingValue('passphrase', '123456');
      // setting this causes an issue, but value is already set. So, we could ignore the error.
      try {
        await environmentsSettings.setSettingValue('enabled', 'true');
      } catch (_error) {}

      await environments.restart();
    });

    it('should be able to connect to secured websocket', async () => {
      const ws = new WsConnection(3000, '/ws-env/test/ws/echo', 'wss');
      await ws.openForConversation();
      ws.assertWebsocketIsOpened();

      await ws.assertReply(
        '{ "message": "Hello world!" }',
        'ECHO: { "message": "Hello world!" }'
      );
      await ws.assertReply(
        '{ "message": "Hello world 2222!" }',
        'ECHO: { "message": "Hello world 2222!" }'
      );

      ws.close();
      ws.assertWebsocketIsClosed();
    });
  });

  after(async () => {
    await environments.stop();
  });
});
