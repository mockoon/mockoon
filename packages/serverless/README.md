<div align="center">
  <a href="https://mockoon.com" alt="mockoon logo">
    <img width="200" height="200" src="https://mockoon.com/images/logo-square-serverless.png">
  </a>
  <br>
  <a href="https://mockoon.com/download/"><img src="https://img.shields.io/badge/Download%20app-Go-green.svg?style=flat-square&colorB=1997c6"/></a>
  <a href="https://mockoon.com/"><img src="https://img.shields.io/badge/Website-Go-green.svg?style=flat-square&colorB=1997c6"/></a>
  <a href="https://mockoon.com/newsletter/"><img src="https://img.shields.io/badge/Newsletter-Subscribe-green.svg?style=flat-square"/></a>
  <a href="https://twitter.com/GetMockoon"><img src="https://img.shields.io/badge/Twitter_@GetMockoon-follow-blue.svg?style=flat-square&colorB=1da1f2"/></a>
  <a href="https://discord.gg/FtJjkejKGp"><img src="https://img.shields.io/badge/Discord-go-blue.svg?style=flat-square&colorA=6c84d9&colorB=1da1f2"/></a>
  <br>
  <a href="https://www.npmjs.com/package/@mockoon/serverless"><img src="https://img.shields.io/npm/v/@mockoon/serverless.svg?style=flat-square&colorB=cb3837"/></a>
  <br>
  <br>
  <h1>@Mockoon/serverless</h1>
</div>

Mockoon's Serverless package provides an easy way to run Mockoon's mock APIs in cloud functions and serverless environments: AWS Lambda, GCP Functions, Firebase Functions, etc.

The Serverless package supports the same features as the main [application](https://github.com/mockoon/mockoon/blob/main/packages/desktop) and [CLI](https://github.com/mockoon/mockoon/blob/main/packages/cli) (with some limitations, see below): [templating system](https://mockoon.com/docs/latest/templating/overview/), [proxy mode](https://mockoon.com/docs/latest/server-configuration/proxy-mode/), [route response rules](https://mockoon.com/docs/latest/route-responses/dynamic-rules/), etc.

## Using this package

### Installation

```sh-session
$ npm install @mockoon/serverless
```

### Mockoon's data file

The Serverless package needs a Mockoon `Environment` object loaded from a [data file](https://mockoon.com/docs/latest/mockoon-data-files/data-storage-location/).
You are responsible for loading this data file (from a URL, S3, etc.) and providing the object to the class constructor (see below).

In the examples below, we will be loading the data file as if it was located next to your function's main file.

### Request listener (Express application)

This package exposes a single `MockoonServerless` class. To create a new `RequestListener` (an Express application), use the following code:

```javascript
const mockoon = require('@mockoon/serverless');

// Load the Mockoon Environment object
const mockEnv = require('./datafile.json');

const app = new mockoon.MockoonServerless(mockEnv);

exports.handler = app;
```

For vendor-specific code, see the sections below.

### AWS Lambda

To use Mockoon Serverless in an AWS Lambda, you can use the following code:

```javascript
const mockoon = require('@mockoon/serverless');

// Load the Mockoon Environment object
const mockEnv = require('./datafile.json');

const mockoonServerless = new mockoon.MockoonServerless(mockEnv);

module.exports.handler = mockoonServerless.awsHandler();
```

`@mockoon/serverless` is using the [`serverless-http`](https://www.npmjs.com/package/serverless-http) package to wrap Mockoon's Express.js API.

### Firebase/GCP Functions

To use Mockoon Serverless in a Firebase Function, you can use the following code:

```javascript
const { onRequest } = require('firebase-functions/v2/https');
const mockoon = require('@mockoon/serverless');

// Load the Mockoon Environment object
const mockEnv = require('./datafile.json');

const app = new mockoon.MockoonServerless(mockEnv).firebaseApp();

exports.app = onRequest(app);
```

Since Firebase Functions uses GCP Functions underhood, a sighly different approach can be used with the [functions-framework-nodejs](https://github.com/GoogleCloudPlatform/functions-framework-nodejs):

```javascript
const functions = require('@google-cloud/functions-framework');
const mockoon = require('@mockoon/serverless');

// Load the Mockoon Environment object
const mockEnv = require('./datafile.json');

const app = new mockoon.MockoonServerless(mockEnv).firebaseApp();

functions.http('app', app);
```

### Netlify Functions

To use Mockoon Serverless with Netlify's serverless functions, first create a new Netlify function with the following code:

```javascript
const mockoon = require('@mockoon/serverless');

// Load the Mockoon Environment object
const mockEnv = require('./datafile.json');

const mockoonServerless = new mockoon.MockoonServerless(mockEnv);

exports.handler = mockoonServerless.netlifyHandler();
```

If you're not sure how to create a Netlify function, please [read their official documentation](https://docs.netlify.com/functions/create/?fn-language=js).

Then, you will need to setup a [redirect](https://docs.netlify.com/integrations/frameworks/express/) to direct requests to the mock API. A prefix like `api` is frequently used to distinguish between the requests targeting hosted websites, from requests targeting the API. Netlify will forward the full path to the running Mockoon serverless function which means that you need the [same prefix in your mock](https://mockoon.com/docs/latest/api-endpoints/routing/#api-prefix) configuration.
To add this redirection in your `netlify.toml` you have two possibilities:

```toml
[[redirects]]
  force = true
  from = "/api/*"
  status = 200
  to = "/.netlify/functions/{NAME_OF_YOUR_FUNCTION}/api/:splat"
```

or

```toml
[[redirects]]
  force = true
  from = "/api/*"
  status = 200
  to = "/.netlify/functions/{NAME_OF_YOUR_FUNCTION}"
```

After deploying to Netlify, any request starting with `/api/*` (e.g. `https://APP_NAME.netlify.app/api/endpoint`) would match the corresponding route (e.g. `/api/endpoint`) in your Mockoon config. You can also test locally using the Netlify CLI.

## Options

The `MockoonServerless` class accepts an optional `options` object as a second parameter. The following options are available:

| Option name           | Type       | Default value | Description                                                                                                                  |
| --------------------- | ---------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `logTransaction`      | `boolean`  | `false`       | [Enable full transaction logging](#transaction-logging) (see below).                                                         |
| `disabledRoutes`      | `string[]` | `[]`          | Disable route(s) by UUID(s) or keyword(s) in route path (see [below](#fakerjs-options)).                                     |
| `fakerOptions.locale` | `string`   | `[]`          | Faker locale (e.g. 'en', 'en_GB', etc. For supported locales, see below.)                                                    |
| `fakerOptions.seed`   | `number`   | `[]`          | Number for the Faker.js seed (e.g. 1234)                                                                                     |
| `envVarsPrefix`       | `string`   | `MOCKOON_`    | [Environment variables prefix](https://mockoon.com/docs/latest/variables/environment-variables/). Leave empty to disable it. |

Example:

```javascript
const mockoonServerless = new mockoon.MockoonServerless(mockEnv, {
  logTransaction: true,
  // disable all routes containing 'users' in their path, and the route with UUID '0999df54-7d57-407e-9325-c18d97fea729'
  disabledRoutes: ['users', '0999df54-7d57-407e-9325-c18d97fea729'],
  fakerOptions: {
    locale: 'en_GB',
    seed: 1234
  },
  envVarsPrefix: 'CUSTOM_PREFIX_'
});
```

#### Faker.js options

- **Locale**: If not provided, Faker.js will use the default locale: `en`. For a list of currently supported locales, you can check the [supported locales list](https://github.com/mockoon/mockoon/blob/main/packages/commons/src/models/faker.model.ts#L1) in Mockoon's commons library. You can also check [Faker.js locales list](https://fakerjs.dev/guide/localization.html#available-locales) for more information (⚠️ Some locales may not yet be implemented in Mockoon).
- **Seed**: If not provided, Faker.js will not use a seed. By providing a seed value, you can generate repeatable sequences of fake data. Using seeding will not always generate the same value but rather a predictable sequence.

## Logging

Mockoon's Serverless package logs all server events (start, stop, proxy creation, transactions, etc.) to the console. You can also enable full transaction logging to log all requests and responses (see below).

### Transaction logging

When using the `logTransaction` option, logs will contain the full transaction (request and response) with the same information you can see in the desktop application "Logs" tab.

Example:

```json
{
  "app": "mockoon-server",
  "level": "info",
  "message": "Transaction recorded",
  "timestamp": "YYYY-MM-DDTHH:mm:ss.sssZ",
  "environmentName": "Demo API",
  "environmentUUID": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "requestMethod": "GET",
  "requestPath": "/test",
  "requestProxied": false,
  "responseStatus": 200,
  "transaction": {
    "proxied": false,
    "request": {
      "body": "{}",
      "headers": [{ "key": "accept", "value": "*/*" }],
      "method": "GET",
      "params": [],
      "query": "",
      "queryParams": {},
      "route": "/test",
      "urlPath": "/test"
    },
    "response": {
      "body": "{}",
      "headers": [
        { "key": "content-type", "value": "application/json; charset=utf-8" }
      ],
      "statusCode": 200,
      "statusMessage": "OK"
    },
    "routeResponseUUID": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "routeUUID": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

To enable full transaction logging, set `logTransaction` to `true` in the constructor options:

```javascript
const mockoonServerless = new mockoon.MockoonServerless(mockEnv, {
  logTransaction: true
});
```

The `transaction` model can be found [here](https://github.com/mockoon/mockoon/blob/main/packages/commons/src/models/server.model.ts#L33-L53).

## Disabling routes

When using the `disabledRoutes` option, you can disable routes by UUID(s) or keyword(s) in route path. This is the counterpart of the "Toggle route" feature in the desktop application (right-click on a route -> "Toggle route").

## Serverless package limitations

Due to the stateless nature of cloud functions, some of Mockoon's features will not work:

- the [data buckets](https://mockoon.com/docs/latest/data-buckets/overview/) will not be persisting and be regenerated during each call.
- the [rules](https://mockoon.com/docs/latest/route-responses/dynamic-rules/#1-target) based on the request number will not work as this counter will be reset during each call.

## Support/feedback

You can discuss all things related to Mockoon, and ask for help, on the [official community](https://github.com/mockoon/mockoon/discussions). It's also a good place to discuss bugs and feature requests before opening an issue on this repository. For more chat-like discussions, you can also join our [Discord server](https://discord.gg/FtJjkejKGp).

## Contributing

If you are interested in contributing to Mockoon, please take a look at the [contributing guidelines](https://github.com/mockoon/mockoon/blob/main/CONTRIBUTING.md).

Please also take a look at our [Code of Conduct](https://github.com/mockoon/mockoon/blob/main/CODE_OF_CONDUCT.md).

## Documentation

You will find Mockoon's [documentation](https://mockoon.com/docs/latest) on the official website. It covers Mockoon's most complex features. Feel free to contribute or ask for new topics to be covered.

## Roadmap

If you want to know what will be coming in the next release you can check the global [Roadmap](https://mockoon.com/public-roadmap/).

New releases will be announced on Mockoon's [Twitter account @GetMockoon](https://twitter.com/GetMockoon) and through the newsletter to which you can subscribe [here](https://mockoon.com/newsletter/).
