import { shell } from 'electron';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { Config } from 'src/main/config';
import { getMainWindow } from 'src/main/libs/main-window';
import { parse as urlParse } from 'url';

let server: Server | undefined;
let authCallbackServerTimeout: NodeJS.Timeout | undefined;
const authCallbackServerTimeoutMs = 5 * 60 * 1000;

const authCallbackPage = `<!doctype html>
<html lang="en" style="height: 100%;">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mockoon authentication complete</title>
  </head>
  <body style="height: 100%; margin: 0;font-family: sans-serif;background-color: #252830;color: #b8bcc4;font-size: 18px;">
    <div style="max-width: 80vw;margin: 0 auto">
      <div style="display: flex; justify-content: center; height: 100%;margin-top: 10vh;">
        <div style="text-align: center; margin: 0 auto;">
          <h1>Success!</h1>
          <p style="margin:0;">Authentication complete. You can close this window.</p>
          <img src="https://mockoon.com/images/logo-eyes-sticker.png" alt="Mockoon logo" style="max-width: 140px;margin-top: 5vh;">
          <hr style="margin-top: 5vh; margin-bottom: 5vh; border: 0; border-top: 1px solid #323641;">
          <p style="margin:0;">Didn't work? Copy the token and paste it in the application.</p>
          <code style="display: block; margin-top: 1vh; background-color: #323641; color: #b8bcc4; padding: 0.5em 1em; border-radius: 4px; max-width: 80%; box-sizing: border-box; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; margin: 1vh auto;user-select:all;">{{code}}</code>
        </div>
      </div>
    </div>
  </body>
</html>`;

/**
 * Stop the auth callback server
 */
export function stopAuthCallbackServer() {
  if (authCallbackServerTimeout) {
    clearTimeout(authCallbackServerTimeout);
    authCallbackServerTimeout = undefined;
  }

  if (server) {
    server.close();
    server = undefined;
  }
}

/**
 * Start a server to listen for the auth callback from the website
 * and send the token to the renderer process
 */
export const startAuthCallbackServer = async (loginURL?: string) => {
  // Close the server if already started
  stopAuthCallbackServer();

  // Start a server to listen for the auth callback
  server = createServer((req, res) => {
    const { query } = urlParse(req.url ?? '', true);
    const code: string = query['code'] as string;

    // Send the token to the renderer process
    if (code) {
      getMainWindow().webContents.send('APP_AUTH_CALLBACK', code);
      stopAuthCallbackServer();
    }

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    });

    res.end(authCallbackPage.replace('{{code}}', code));
  });

  server.listen(0, '127.0.0.1', () => {
    authCallbackServerTimeout = setTimeout(() => {
      stopAuthCallbackServer();
    }, authCallbackServerTimeoutMs);

    if (!server) {
      return;
    }

    shell.openExternal(
      `${loginURL || Config.loginURL}?appRedirect=http://127.0.0.1:${(server.address() as AddressInfo).port}`
    );
  });
};
