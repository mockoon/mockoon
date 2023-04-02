<div align="center">
  <a href="https://mockoon.com" alt="mockoon logo">
    <img width="200" height="200" src="https://mockoon.com/images/logo-square-cli.png">
  </a>
  <br>
  <a href="https://mockoon.com/download/"><img src="https://img.shields.io/badge/Download%20app-Go-green.svg?style=flat-square&colorB=1997c6"/></a>
  <a href="https://mockoon.com/"><img src="https://img.shields.io/badge/Website-Go-green.svg?style=flat-square&colorB=1997c6"/></a>
  <a href="http://eepurl.com/dskB2X"><img src="https://img.shields.io/badge/Newsletter-Subscribe-green.svg?style=flat-square"/></a>
  <a href="https://twitter.com/GetMockoon"><img src="https://img.shields.io/badge/Twitter_@GetMockoon-follow-blue.svg?style=flat-square&colorB=1da1f2"/></a>
  <a href="https://discord.gg/MutRpsY5gE"><img src="https://img.shields.io/badge/Discord-go-blue.svg?style=flat-square&colorA=6c84d9&colorB=1da1f2"/></a>
  <br>
  <a href="https://www.npmjs.com/package/@mockoon/cli"><img src="https://img.shields.io/npm/v/@mockoon/cli.svg?style=flat-square&colorB=cb3837"/></a>
  <br>
  <br>
  <h1>@Mockoon/cli</h1>
</div>

Welcome to Mockoon's official CLI, a lightweight and fast NPM package to deploy your mock APIs anywhere.
Feed it with a Mockoon's [data file](https://mockoon.com/docs/latest/mockoon-data-files/data-storage-location/), or OpenAPI specification file (JSON or YAML), and you are good to go.

The CLI supports the same features as the main application: [templating system](https://mockoon.com/docs/latest/templating/overview/), [proxy mode](https://mockoon.com/docs/latest/proxy-mode/), [route response rules](https://mockoon.com/docs/latest/route-responses/dynamic-rules/), etc.

![Mockoon CLI screenshot](https://github.com/mockoon/mockoon/raw/main/packages/cli/docs/screenshot.png)

- [Installation](#installation)
- [Run a mock API with the CLI](#run-a-mock-api-with-the-cli)
  - [Use your Mockoon environment file](#use-your-mockoon-environment-file)
  - [Use an OpenAPI specification file](#use-an-openapi-specification-file)
- [Compatibility](#compatibility)
- [Commands](#commands)
  - [`mockoon-cli start`](#mockoon-cli-start)
  - [`mockoon-cli list [ID]`](#mockoon-cli-list-id)
  - [`mockoon-cli stop [ID]`](#mockoon-cli-stop-id)
  - [`mockoon-cli dockerize`](#mockoon-cli-dockerize)
  - [`mockoon-cli help [COMMAND]`](#mockoon-cli-help-command)
- [Docker](#docker)
  - [Using the generic Docker image](#using-the-generic-docker-image)
  - [Using the `dockerize` command](#using-the-dockerize-command)
- [Logs](#logs)
- [PM2](#pm2)
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

You will find Mockoon [CLI](https://mockoon.com/releases/cli/) changelogs on the official website.

## Run a mock API with the CLI

### Use your Mockoon environment file

The CLI can import and migrate data from older versions of Mockoon. However, it doesn't alter the file you provide and only migrates a copy. If you created your mock with a more recent version of the application, you need to update your CLI with the following command: `npm install -g @mockoon/cli`.

You can run your mock in one single step using the [start command](#mockoon-cli-start) and replacing `~/path/to/your-environment-file.json` by the actual location of your Mockoon environment file:

```sh-sessions
$ mockoon-cli start --data ~/path/to/your-environment-file.json
```

> To locate your environment file from the main application, right-click on a environment and select "Show in folder" in the context menu:
> ![context menu - show in folder](https://github.com/mockoon/mockoon/raw/main/packages/cli/docs/environment-show-in-folder.png)

You can also directly load Mockoon's environment file from a URL. To do so, provide the URL as the `data` parameter instead of a local path:

```sh-sessions
$ mockoon-cli start --data https://domain.com/your-environment-file.json
```

> **Use a legacy export file**
>
> While we recommend using the method above to launch your mocks with the CLI, you can still use Mockoon's [legacy export files](https://mockoon.com/docs/latest/mockoon-data-files/import-export-mockoon-format/).

### Use an OpenAPI specification file

Another option is to directly pass an OpenAPI specification file as the `data` parameter. Mockoon supports both JSON and YAML formats in versions 2.0.0 and 3.0.0.

> /!\ There is currently no equivalent between all the OpenAPI specifications and Mockoon's features ([more info](https://mockoon.com/docs/latest/openapi/openapi-specification-compatibility/)). If you want to run your Mockoon mock APIs with the CLI with all the features (templating, rules, etc.), you must use Mockoon's data files ([see above](#use-your-mockoon-environment-file)) directly, or you may lose part of your mock's behavior.

You can provide a path to a local OpenAPI specification file or directly the file's URL:

```sh-sessions
$ mockoon-cli start --data ~/path/to/your-opeanapi-file.yaml
```

Or,

```sh-sessions
$ mockoon-cli start --data https://domain.com/your-opeanapi-file.yaml
```

## Compatibility

Mockoon's CLI has been tested on Node.js versions 14, 15 and 16.

## Commands

- [`mockoon-cli start`](#mockoon-cli-start)
- [`mockoon-cli list [ID]`](#mockoon-cli-list-id)
- [`mockoon-cli stop [ID]`](#mockoon-cli-stop-id)
- [`mockoon-cli dockerize`](#mockoon-cli-dockerize)
- [`mockoon-cli help [COMMAND]`](#mockoon-cli-help-command)

### `mockoon-cli start`

Starts one (or more) mock API from Mockoon's environment file(s).

The process will be created by default with the name and port of the Mockoon's environment. You can override these values by using the `--port` and `--pname` flags.
`--data`, `--port`, `--pname` and `--hostname` flags support multiple entries to run multiple mock APIs at once (see examples below).

Using the `--daemon-off` flag will keep the CLI in the foreground. The mock API process will not be [managed by PM2](#pm2). When running as a blocking process, all the logs are sent to both stdout (console) and the [usual files](logs).

> This command is compatible with [legacy export files](https://mockoon.com/docs/latest/mockoon-data-files/import-export-mockoon-format/). As an export file can contain multiple environments, you can indicate the one you want to run by specifying its `--index` or its `--name`. If only one environment is present in the file, you can omit the index, and the CLI will run it by default.

```
USAGE
  $ mockoon-cli start

OPTIONS
  -d, --data              [required] Path(s) or URL(s) to your Mockoon file(s)
  -N, --pname             Override process(es) name(s)
  -p, --port              Override environment(s) port(s)
  -l, --hostname          Override default listening hostname(s)
  -t, --log-transaction   Log the full HTTP transaction (request and response)
  -r, --repair            If the data file seems too old, or an invalid Mockoon file, migrate/repair without prompting
  -D, --daemon-off        Keep the CLI in the foreground and do not manage the process with PM2
  -h, --help              Show CLI help

EXAMPLES
  $ mockoon-cli start --data ~/data.json
  $ mockoon-cli start --data ~/data1.json ~/data2.json --port 3000 3001 --pname mock1 mock2 --hostname 127.0.0.1 192.168.1.1
  $ mockoon-cli start --data https://file-server/data.json
  $ mockoon-cli start --data ~/data.json --pname "proc1"
  $ mockoon-cli start --data ~/data.json --daemon-off
  $ mockoon-cli start --data ~/data.json --log-transaction
```

### `mockoon-cli list [ID]`

_Command alias: `info`_

Lists all the running mock APIs and display some information: process name, pid, status, cpu, memory, port.
You can also get the same information for a specific mock API by providing its pid or name.

```
USAGE
  $ mockoon-cli list

ARGUMENTS
  ID  Running API pid or name

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ mockoon-cli list
  $ mockoon-cli info
  $ mockoon-cli list 0
  $ mockoon-cli list "Mock_environment"
```

### `mockoon-cli stop [ID]`

Stops one or more running processes. When 'all' is provided, all processes will be stopped.

```
USAGE
  $ mockoon-cli stop [ID]

ARGUMENTS
  ID  Running API pid or name

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ mockoon-cli stop
  $ mockoon-cli stop 0
  $ mockoon-cli stop "name"
  $ mockoon-cli stop "all"
```

### `mockoon-cli dockerize`

Generates a Dockerfile used to build a self-contained image of one or more mock API. After building the image, no additional parameters will be needed when running the container.
This command takes similar flags as the [`start` command](#mockoon-start).

Please note that this command will copy your Mockoon environment from the file you provide and put it side by side with the generated Dockerfile. Both files are required in order to build the image.

For more information on how to build the image: [Using the dockerize command](#using-the-dockerize-command)

```
USAGE
  $ mockoon-cli dockerize

OPTIONS
  -d, --data              [required] Path or URL to your Mockoon file
  -p, --port              Override environment's port
  -o, --output            [required] Generated Dockerfile path and name (e.g. `./Dockerfile`)
  -t, --log-transaction   Log the full HTTP transaction (request and response)
  -r, --repair            If the data file seems too old, or an invalid Mockoon file, migrate/repair without prompting
  -h, --help              Show CLI help

EXAMPLES
  $ mockoon-cli dockerize --data ~/data.json --output ./Dockerfile
  $ mockoon-cli dockerize --data ~/data1.json ~/data2.json --output ./Dockerfile
  $ mockoon-cli dockerize --data https://file-server/data.json --output ./Dockerfile
```

### `mockoon-cli help [COMMAND]`

Returns information about a command.

```
USAGE
  $ mockoon-cli help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

## Docker

### Using the generic Docker image

A generic Docker image is published on the [Docker Hub Mockoon CLI repository](https://hub.docker.com/r/mockoon/cli). It uses `node:14-alpine` and installs the latest version of Mockoon CLI.

All of `mockoon-cli start` flags (`--port`, etc.) must be provided when running the container.

To load the Mockoon data, you can either mount a local data file and pass `mockoon-cli start` flags at the end of the command:

`docker run -d --mount type=bind,source=/home/your-data-file.json,target=/data,readonly -p 3000:3000 mockoon/cli:latest --data data --port 3000`

Or directly pass a URL to the `mockoon-cli start` command, without mounting a local data file:

`docker run -d -p 3000:3000 mockoon/cli:latest -d https://raw.githubusercontent.com/mockoon/mock-samples/main/samples/generate-mock-data.json --port 3000`

Mockoon CLI's logs will be sent to both stdout (console) and the [usual files](#logs).

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

You can use the [`dockerize` command](#mockoon-cli-dockerize) to generate a new Dockerfile that will allow you to build a self-contained image. Thus, no Mockoon CLI specific parameters will be needed when running the container. You can still provide arguments at runtime if needed (see the last example).

- Run the `dockerize` command:

  `mockoon-cli dockerize --data ./sample-data.json --port 3000 --output ./tmp/Dockerfile`

- navigate to the `tmp` folder, where the Dockerfile has been generated:

  `cd tmp`

- Build the image:

  `docker build -t mockoon-mock1 .`

- Run the container:

  `docker run -d -p <host_port>:3000 mockoon-mock1`

- Or run the container with arguments:

  `docker run -d -p <host_port>:3000 mockoon-mock1 --log-transaction`

## Logs

Logs are located in `~/.mockoon-cli/logs/{mock-name}-[error|out].log`.

The `error.log` file contains mostly server errors that occur at startup time and prevent the mock API to run (port already in use, etc.). They shouldn't occur that often.

The `out.log` file contains all other log entries (all levels) produced by the running mock server. Most of the errors occurring in Mockoon CLI (or the main application) are not critical and therefore considered as normal output. As an example, if the JSON body from an entering request is erroneous, Mockoon will log a JSON parsing error, but it won't block the normal execution of the application.

When running the CLI with the [`--daemon-off` flag](#mockoon-cli-start), logs are sent to both stdout (console) and the above files.

When using the `--log-transaction` flag, logs will contain the full transaction (request and response) with the same information you can see in the desktop application.

Example:

```json
{
  "level": "info",
  "message": "GET /api/test | 200",
  "timestamp": "2021-12-08T14:50:05.004Z",
  "transaction": {
    "proxied": false,
    "request": {
      "body": "",
      "headers": [
        { "key": "accept", "value": "application/json, text/plain, */*" }
      ],
      "method": "GET",
      "params": [],
      "queryParams": [],
      "route": "/api/test",
      "urlPath": "/api/test"
    },
    "response": {
      "body": "response",
      "headers": [
        { "key": "content-length", "value": "8" },
        { "key": "content-type", "value": "application/json; charset=utf-8" }
      ],
      "statusCode": 200
    },
    "routeResponseUUID": "b1ba948f-82b3-4cc2-8067-692e562319ab",
    "routeUUID": "304a761f-351d-415a-bf59-6e927322ae63"
  }
}
```

The `transaction` model can be found [here](https://github.com/mockoon/commons/blob/main/src/models/server.model.ts#L26-L44).

## PM2

Mockoon CLI uses [PM2](https://pm2.keymetrics.io/) to start, stop or list the running mock APIs when you are not using the `--daemon-off` flag. Therefore, you can directly use PM2 commands to manage the processes.

## Mockoon's documentation

You will find Mockoon's [documentation](https://mockoon.com/docs/latest) on the official website. It covers the most complex features.

## Sponsors

Mockoon is an open-source project built by volunteer maintainers. If you like our application, please consider sponsoring us and join all the [Sponsors and Backers](https://github.com/mockoon/mockoon/blob/main/backers.md) who helped this project over time!

<div align="center">
<a href="https://github.com/sponsors/mockoon"><img src="https://mockoon.com/images/sponsor-btn.png" width="250" alt="sponsor button" /></a>
</div>

## Support/feedback

You can discuss all things related to Mockoon's CLI, and ask for help, on the [official community](https://github.com/mockoon/mockoon/discussions). It's also a good place to discuss bugs and feature requests before opening an issue on this repository. For more chat-like discussions, you can also join our [Discord server](https://discord.gg/MutRpsY5gE).

## Contributing

If you are interested in contributing to Mockoon, please take a look at the [contributing guidelines](https://github.com/mockoon/mockoon/blob/main/CONTRIBUTING.md).

Please also take a look at our [Code of Conduct](https://github.com/mockoon/mockoon/blob/main/CODE_OF_CONDUCT.md).

## Roadmap

If you want to know what will be coming in the next release you can check the global [Roadmap](https://github.com/orgs/mockoon/projects/9).

New releases will be announced on Mockoon's [Twitter account @GetMockoon](https://twitter.com/GetMockoon) and through the newsletter to which you can subscribe [here](http://eepurl.com/dskB2X).
