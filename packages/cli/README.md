<div align="center">
  <a href="https://mockoon.com" alt="mockoon logo">
    <img width="200" height="200" src="https://mockoon.com/images/logo-square-cli.png">
  </a>
  <br>
  <a href="https://mockoon.com/download/"><img src="https://img.shields.io/badge/Download%20app-Go-green.svg?style=flat-square&colorB=1997c6"/></a>
  <a href="https://mockoon.com/"><img src="https://img.shields.io/badge/Website-Go-green.svg?style=flat-square&colorB=1997c6"/></a>
  <a href="https://mockoon.com/newsletter/"><img src="https://img.shields.io/badge/Newsletter-Subscribe-green.svg?style=flat-square"/></a>
  <a href="https://twitter.com/GetMockoon"><img src="https://img.shields.io/badge/Twitter_@GetMockoon-follow-blue.svg?style=flat-square&colorB=1da1f2"/></a>
  <a href="https://discord.gg/FtJjkejKGp"><img src="https://img.shields.io/badge/Discord-go-blue.svg?style=flat-square&colorA=6c84d9&colorB=1da1f2"/></a>
  <br>
  <a href="https://www.npmjs.com/package/@mockoon/cli"><img src="https://img.shields.io/npm/v/@mockoon/cli.svg?style=flat-square&colorB=cb3837"/></a>
  <br>
  <br>
  <h1>@Mockoon/cli</h1>
</div>

Welcome to Mockoon's official CLI, a lightweight and fast NPM package to deploy your mock APIs anywhere.
Feed it with a Mockoon's [data file](https://mockoon.com/docs/latest/mockoon-data-files/data-storage-location/), or OpenAPI specification file (JSON or YAML), and you are good to go.

The CLI supports the same features as the main application: [templating system](https://mockoon.com/docs/latest/templating/overview/), [proxy mode](https://mockoon.com/docs/latest/server-configuration/proxy-mode/), [route response rules](https://mockoon.com/docs/latest/route-responses/dynamic-rules/), etc.

![Mockoon CLI screenshot](https://mockoon.com/images/cli-hero-repo.png)

- [Installation](#installation)
- [Run a mock API with the CLI](#run-a-mock-api-with-the-cli)
  - [Use your Mockoon environment file](#use-your-mockoon-environment-file)
  - [Use an OpenAPI specification file](#use-an-openapi-specification-file)
- [Compatibility](#compatibility)
- [Commands](#commands)
  - [Start command](#start-command)
  - [Dockerize command](#dockerize-command)
  - [Import command](#import-command)
  - [Export command](#export-command)
  - [Help command](#help-command)
- [Use the GitHub Action](#use-the-github-action)
- [Docker image](#docker-image)
  - [Using the generic Docker image](#using-the-generic-docker-image)
  - [Using the `dockerize` command](#using-the-dockerize-command)
- [Logs](#logs)
- [Mockoon's documentation](#mockoons-documentation)
- [Sponsors](#sponsors)
- [Support/feedback](#supportfeedback)
- [Contributing](#contributing)
- [Roadmap](#roadmap)

## Installation

```sh-session
$ npm install -g @mockoon/cli
```

Usage:

```sh-session
$ mockoon-cli COMMAND
```

## Changelogs

You will find Mockoon applications [changelogs](https://mockoon.com/releases/) on the official website.

## Run a mock API with the CLI

### Use your Mockoon environment file

The CLI can import and migrate data from older versions of Mockoon. However, it doesn't alter the file you provide and only migrates a copy. If you created your mock with a more recent version of the application, you need to update your CLI with the following command: `npm install -g @mockoon/cli`.

You can run your mock in one single step using the [start command](#mockoon-cli-start) and replacing `~/path/to/your-environment-file.json` by the actual location of your Mockoon environment file:

```sh-sessions
$ mockoon-cli start --data ~/path/to/your-environment-file.json
```

> To locate your environment file from the main application, right-click on a environment and select "Show in folder" in the context menu:
> ![context menu - show in folder](https://mockoon.com/images/docs/repo/cli/environment-show-in-folder.png)

You can also directly load Mockoon's environment file from a URL. To do so, provide the URL as the `data` parameter instead of a local path:

```sh-sessions
$ mockoon-cli start --data https://domain.com/your-environment-file.json
```

### Use an OpenAPI specification file

Another option is to directly pass an OpenAPI specification file as the `data` parameter. Mockoon supports both JSON and YAML formats in versions 2.0.0 and 3.0.0.

> ⚠️ There is currently no equivalent between all the OpenAPI specifications and Mockoon's features ([more info](https://mockoon.com/docs/latest/openapi/openapi-specification-compatibility/)). If you want to run your Mockoon mock APIs with the CLI with all the features (templating, rules, etc.), you must use Mockoon's data files ([see above](#use-your-mockoon-environment-file)) directly, or you may lose part of your mock's behavior.

You can provide a path to a local OpenAPI specification file or directly the file's URL:

```sh-sessions
$ mockoon-cli start --data ~/path/to/your-opeanapi-file.yaml
```

Or,

```sh-sessions
$ mockoon-cli start --data https://domain.com/your-opeanapi-file.yaml
```

## Compatibility

Mockoon's CLI has been tested on Node.js versions 18 and 20.

## Commands

- [Start command](#start-command)
- [Dockerize command](#dockerize-command)
- [Import command](#import-command)
- [Export command](#export-command)
- [Help command](#help-command)

### Start command

Starts one (or more) mock API from Mockoon's environment file(s) as a foreground process.

The mocks will run by default on the ports and hostnames specified in the files. You can override these values by using the `--port` and `--hostname` flags.
`--data`, `--port` and `--hostname` flags support multiple entries to run multiple mock APIs at once (see examples below).

> 💡 To run the CLI as a background process, add an `&` at the end of the command: `mockoon-cli start -d ./data-file.json &`.

```
USAGE
  $ mockoon-cli start

OPTIONS
  -d, --data                   [required] Path(s) or URL(s) to your Mockoon file(s)
  -p, --port                   Override environment(s) port(s)
  -l, --hostname               Override default listening hostname(s)
  -c, --faker-locale           Faker locale (e.g. 'en', 'en_GB', etc. For supported locales, see below.)
  -s, --faker-seed             Number for the Faker.js seed (e.g. 1234)
  -t, --log-transaction        Log the full HTTP transaction (request and response)
  -X, --disable-log-to-file    Disable logging to file
  -e, --disable-routes         Disable route(s) by UUID or keyword present in the route's path (do not include a leading slash) or keyword present in a folder name
  -r, --repair                 If the data file seems too old, or an invalid Mockoon file, migrate/repair without prompting
  -x, --env-vars-prefix        Prefix for environment variables (default: 'MOCKOON_')
      --disable-admin-api      Disable the admin API, enabled by default (more info: https://mockoon.com/docs/latest/admin-api/overview/)
      --disable-tls            Disable TLS for all environments. TLS configuration is part of the environment configuration (more info: https://mockoon.com/docs/latest/server-configuration/serving-over-tls/)
      --max-transaction-logs   Maximum number of transaction logs to keep in memory for retrieval via the admin API (default: 100)
      --enable-random-latency  Randomize global and responses latencies between 0 and the specified value (default: false)
  -h, --help                   Show CLI help

EXAMPLES
  $ mockoon-cli start --data ~/data.json
  $ mockoon-cli start --data ~/data1.json ~/data2.json --port 3000 3001 --hostname 127.0.0.1 192.168.1.1
  $ mockoon-cli start --data https://file-server/data.json
  $ mockoon-cli start --data ~/data.json --log-transaction
  $ mockoon-cli start --data ~/data.json --disable-routes route1 route2 folder1
```

#### Admin API

Each running mock API has an admin API enabled by default and available at `/mockoon-admin/`. This API allows you to interact with the running mock API, retrieve logs, and more. You can disable the admin API with the `--disable-admin-api` flag.

> 💡 To learn more about the admin API, check the [documentation](https://mockoon.com/docs/latest/admin-api/overview/).

#### Faker.js options

- **Locale**: You can set up Faker.js locale with the `--faker-locale` flag. If not provided, Faker.js will use the default locale: `en`. For a list of currently supported locales, you can check the [supported locales list](https://github.com/mockoon/mockoon/blob/main/packages/commons/src/models/faker.model.ts#L1) in Mockoon's commons library. You can also check [Faker.js locales list](https://fakerjs.dev/guide/localization.html#available-locales) for more information (⚠️ Some locales may not yet be implemented in Mockoon).
- **Seed**: You can set up Faker.js seed with the `--faker-seed` flag. If not provided, Faker.js will not use a seed. By providing a seed value, you can generate repeatable sequences of fake data. Using seeding will not always generate the same value but rather a predictable sequence.

#### Customize the environment variables prefix

You can access environment variables in your routes' responses by using the [`{{getEnvVar 'VARIABLE_NAME'}}` templating helper](https://mockoon.com/docs/latest/variables/environment-variables/). By default, only the environment variables prefixed with `MOCKOON_` are available, for example, `MOCKOON_MY_VARIABLE`.

You can customize the prefix with the `--env-vars-prefix` flag. For example, if you set `--env-vars-prefix CUSTOM_PREFIX_`, you will be able to access the environment variable `CUSTOM_PREFIX_MY_VARIABLE` in your routes' responses. To disable the prefix, set it to an empty string: `--env-vars-prefix ''` or `--env-vars-prefix=`.

#### Disabling routes

You can disable routes at runtime by providing their UUIDs or a keyword present in the route's path (do not include a leading slash). You can also disable all the routes present in a folder (including subfolders) by adding a keyword present in a folder name.

This is the counterpart of the "Toggle route" feature in the desktop application (right-click on a route -> "Toggle route").

For example, to disable all routes in a folder named `folder1`, and all routes having "users" in their paths, you can use `--disable-routes folder1 users`.

### Dockerize command

Generates a Dockerfile used to build a self-contained image of one or more mock API. After building the image, no additional parameters will be needed when running the container.
This command takes similar flags as the [`start` command](#mockoon-start).
The `--disable-log-to-file` flag will be enabled by default in the resulting Dockerfile.

Please note that this command will copy your Mockoon environments files you provide with the `--data` flag and put them side by side with the generated Dockerfile.

For more information on how to build the image: [Using the dockerize command](#using-the-dockerize-command)

```
USAGE
  $ mockoon-cli dockerize

OPTIONS
  -d, --data                  [required] Path or URL to your Mockoon file
  -p, --port                  [required] Ports to expose in the Docker container. It should match the number of environment data files you provide with the --data flag.
  -o, --output                [required] Generated Dockerfile path and name (e.g. `./folder/Dockerfile`)
  -t, --log-transaction       Log the full HTTP transaction (request and response)
  -h, --help                  Show CLI help

EXAMPLES
  $ mockoon-cli dockerize --data ~/data.json --output ./Dockerfile
  $ mockoon-cli dockerize --data ~/data1.json ~/data2.json --output ./Dockerfile
  $ mockoon-cli dockerize --data https://file-server/data.json --output ./Dockerfile
```

### Import command

Import a Swagger v2/OpenAPI v3 specification file (YAML or JSON).

The output file will not be prettified by default. You can prettify it using the `--prettify` flag described below.

Note: This command is similar to the app's import feature, but it will not import directly to your desktop app. If you need to import and open in your desktop app, use the app's import feature instead.

```
USAGE
  $ mockoon-cli import

OPTIONS
  -i, --input                 [required] Path or URL to your Swagger v2/OpenAPI v3 file
  -o, --output                [required] Generated Mockoon path and name (e.g. `./environment.json`)
  -p, --prettify              Prettify output
  -h, --help                  Show CLI help

EXAMPLES
  $ mockoon-cli import --input ~/input.json --output ./output.json
  $ mockoon-cli import --input ~/input.yaml --output ./output.json
  $ mockoon-cli import --input ~/input.json --output ./output.json --prettify
```

### Export command

Export a mock API to an OpenAPI v3 specification file (JSON).

The output file will not be prettified by default. You can prettify it using the `--prettify` flag described below.

```
USAGE
  $ mockoon-cli export

OPTIONS
  -i, --input                 [required] Path or URL to your Mockoon data file
  -o, --output                [required] Generated OpenApi v3 path and name (e.g. `./output.json`)
  -p, --prettify              Prettify output
  -h, --help                  Show CLI help

EXAMPLES
  $ mockoon-cli export --input ~/input.json --output ./output.json
  $ mockoon-cli export --input ~/input.json --output ./output.json --prettify
```

### Help command

Returns information about a command.

```
USAGE
  $ mockoon-cli help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

## Use the GitHub Action

We maintain a [GitHub Action](https://github.com/marketplace/actions/mockoon-cli) that allows you to run your Mockoon CLI in your CI/CD pipelines.

You can find a [sample workflow](https://github.com/marketplace/actions/mockoon-cli#github-action-usage) in the GitHub Action's documentation.

Here is an example of a workflow that will run your mock API on every push to the `main` branch:

```yaml
name: Mockoon CLI demo

on:
  push:
    branches:
      - main

jobs:
  mockoon-cli-demo:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Mockoon CLI
        uses: mockoon/cli-action@v2
        with:
          # Mockoon CLI version, default to 'latest'
          version: 'latest'
          # Mockoon local data file or URL
          data-file: './mockoon-data.json'
          # port, default to 3000
          port: 3000
      - name: Make test call
        run: curl -X GET http://localhost:3000/endpoint`
```

> 💡 If you are building your own actions with the CLI, do not forget to add an `&` at the end of the command to run it in the background and avoid blocking the workflow: `mockoon-cli start -d ./data-file.json &`.

## Docker image

### Using the generic Docker image

A generic Docker image is published on the [Docker Hub Mockoon CLI repository](https://hub.docker.com/r/mockoon/cli). It uses `node:18-alpine` and installs the latest version of Mockoon CLI.

All of `mockoon-cli start` flags (`--port`, etc.) must be provided when running the container.

To load the Mockoon data, you can either mount a local data file and pass `mockoon-cli start` flags at the end of the command:

`docker run -d --mount type=bind,source=/home/your-data-file.json,target=/data,readonly -p 3000:3000 mockoon/cli:latest --data data --port 3000`

Or directly pass a URL to the `mockoon-cli start` command, without mounting a local data file:

`docker run -d -p 3000:3000 mockoon/cli:latest -d https://raw.githubusercontent.com/mockoon/mock-samples/main/samples/generate-mock-data.json --port 3000`

Mockoon CLI's logs will be sent to stdout/stderr (console). File logging is disabled by default in the Docker image.

#### Docker compose

You can also use `docker-compose` with a `docker-compose.yml` file:

```
mock-server:
  image: mockoon/cli:latest
  command: ["--data", "data", "--port", "3000"]
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:3000/your-healthcheck-route || exit 1"]
    interval: 30s
    timeout: 5s
    retries: 2
    start_period: 10s
  volumes:
    - /home/your-data-file.json:/data:readonly
```

> Please note that our [Docker image includes an `ENTRYPOINT`](https://github.com/mockoon/mockoon/blob/main/packages/cli/docker/Dockerfile#L16) that you may override or not. If you don't override it, and use Docker compose `command`, do not include `mockoon-cli start` as it is already included in the `ENTRYPOINT`.

This snippet also provides an optional healthcheck, which means you can block until the server is able to handle responses when bring it up by running `docker compose up --detach --wait`.

> This example requires a `your-healthcheck-route` route configured to return a 200 status code without latency.

### Using the `dockerize` command

You can use the [`dockerize` command](#mockoon-cli-dockerize) to generate a new Dockerfile that will allow you to build a self-contained image. Thus, no Mockoon CLI specific parameters will be needed when running the container.

- Run the `dockerize` command:

  `mockoon-cli dockerize --data ./sample-data.json --port 3000 --output ./tmp/Dockerfile`

- navigate to the `tmp` folder, where the Dockerfile has been generated and the environment file(s) copied:

  `cd tmp`

- Build the image:

  `docker build -t mockoon-image .`

- Run the container:

  `docker run -d -p <host_port>:3000 mockoon-image`

## Logs

Logs are located in `~/.mockoon-cli/logs/{mock-name}.log`. This file contains all the log entries (all levels) produced by the running mock server. Most of the errors occurring in Mockoon CLI (or the main application) are not critical and therefore considered as normal output. As an example, if the JSON body from an entering request is erroneous, Mockoon will log a JSON parsing error, but it won't block the normal execution of the application.

As the CLI is running in the foreground, logs are also sent to stdout (console).

### Transaction logging

When using the `--log-transaction` flag, logs will contain the full transaction (request and response) with the same information you can see in the desktop application "Logs" tab.

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

The `transaction` model can be found [here](https://github.com/mockoon/mockoon/blob/main/packages/commons/src/models/server.model.ts#L27-L47).

### Disable logging

You can disable the logging to the console by redirecting the stdout and stderr outputs:

- Unix:

  ```sh-sessions
  mockoon-cli start --data ./data.json > /dev/null 2>&1
  ```

  or:

  ```sh-sessions
  mockoon-cli start --data ./data.json &> /dev/null
  ```

- Windows (cmd):

  ```sh-sessions
  mockoon-cli start --data ./data.json 2> NUL
  ```

  or:

  ```sh-sessions
  mockoon-cli start --data ./data.json > NUL 2>&1
  ```

- Windows (PowerShell):

  ```sh-sessions
  mockoon-cli start --data ./data.json 2> $null
  ```

  or:

  ```sh-sessions
  mockoon-cli start --data ./data.json > $null 2>&1
  ```

- Cross platform: use `dev-null-cli` package
  ```sh-sessions
  mockoon-cli start --data ./data.json | npx dev-null
  ```

You can also disable file logging by using th `--disable-log-to-file` flag. This is enabled by default in the Docker image.

## Mockoon's documentation

You will find Mockoon's [documentation](https://mockoon.com/docs/latest/about/) on the official website.

## Sponsors

Mockoon is an open-source project built by volunteer maintainers. If you like our application, please consider sponsoring us and join all the [Sponsors and Backers](https://github.com/mockoon/mockoon/blob/main/backers.md) who helped this project over time!

<div align="center">
<a href="https://github.com/sponsors/mockoon"><img src="https://mockoon.com/images/sponsor-btn.png" width="250" alt="sponsor button" /></a>
</div>

## Subscribe to Mockoon Cloud

With advanced features for solo developers and teams, Mockoon Cloud supercharges your API development:

- ☁️ [cloud deployments](https://mockoon.com/docs/latest/mockoon-cloud/api-mock-cloud-deployments/)
- 🔄️ [data synchronization and real-time collaboration](https://mockoon.com/docs/latest/mockoon-cloud/data-synchronization-team-collaboration/)
- 🤖 [AI powered API mocking](https://mockoon.com/ai-powered-api-mocking/)
- 📃 Access to dozens of [ready-to-use JSON templates](https://mockoon.com/templates/).
- 💬 Priority support and training.

Upgrade today and take your API development to the next level.

<div align="center" style="margin-top:20px;margin-bottom:20px;">
<a href="https://mockoon.com/cloud/"><img src="https://mockoon.com/images/cloud-btn.png?" width="250" alt="cloud button" /></a>
</div>

## Support/feedback

You can discuss all things related to Mockoon's CLI, and ask for help, on the [official community](https://github.com/mockoon/mockoon/discussions). It's also a good place to discuss bugs and feature requests before opening an issue on this repository. For more chat-like discussions, you can also join our [Discord server](https://discord.gg/FtJjkejKGp).

## Contributing

If you are interested in contributing to Mockoon, please take a look at the [contributing guidelines](https://github.com/mockoon/mockoon/blob/main/CONTRIBUTING.md).

Please also take a look at our [Code of Conduct](https://github.com/mockoon/mockoon/blob/main/CODE_OF_CONDUCT.md).

## Roadmap

If you want to know what will be coming in the next release you can check the global [Roadmap](https://mockoon.com/public-roadmap/).

New releases will be announced on Mockoon's [Twitter account @GetMockoon](https://twitter.com/GetMockoon) and through the newsletter to which you can subscribe [here](https://mockoon.com/newsletter/).
