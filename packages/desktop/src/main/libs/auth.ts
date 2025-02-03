import { shell } from 'electron';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { Config } from 'src/main/config';
import { getMainWindow } from 'src/main/libs/main-window';
import { parse as urlParse } from 'url';

let server: Server = null;

/**
 * Start a server to listen for the auth callback from the website
 * and send the token to the renderer process
 */
export const startAuthCallbackServer = async () => {
  // Close the server if already started
  if (server) {
    server.close();
  }

  // Start a server to listen for the auth callback
  server = createServer((req, res) => {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, Content-Length, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true'
    });
    res.end();

    if (req.method === 'OPTIONS') {
      return;
    }

    const { query } = urlParse(req.url, true);

    // Send the token to the renderer process
    if (query.token) {
      getMainWindow().webContents.send('APP_AUTH_CALLBACK', query.token);
    }
  });

  server.listen(0, '127.0.0.1', () => {
    shell.openExternal(
      `${Config.loginURL}?authCallback=http://127.0.0.1:${(server.address() as AddressInfo).port}`
    );
  });
};

/**
 * Stop the auth callback server
 */
export const stopAuthCallbackServer = () => {
  if (server) {
    server.close();
  }
};
