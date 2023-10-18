export const DOCKER_TEMPLATE = `FROM node:18-alpine

RUN npm install -g @mockoon/cli@{{{version}}}
{{#filePaths}}
COPY {{{.}}} {{{.}}}
{{/filePaths}}

# Install curl for healthcheck and tzdata for timezone support.
RUN apk --no-cache add curl tzdata

# Do not run as root.
RUN adduser --shell /bin/sh --disabled-password --gecos "" mockoon
{{#filePaths}}
RUN chown -R mockoon {{{.}}}
{{/filePaths}}
USER mockoon

EXPOSE {{{ports}}}

ENTRYPOINT {{{entrypoint}}}

# Usage: docker run -p <host_port>:<container_port> mockoon-test`;
