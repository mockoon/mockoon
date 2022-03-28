export const DOCKER_TEMPLATE = `FROM node:14-alpine

RUN npm install -g @mockoon/cli@{{{version}}}
{{#filePaths}}
COPY {{{.}}} ./{{{.}}}
{{/filePaths}}

# Do not run as root.
RUN adduser --shell /bin/sh --disabled-password --gecos "" mockoon
RUN chown -R mockoon ./data
USER mockoon

EXPOSE{{#ports}} {{.}}{{/ports}}

ENTRYPOINT ["mockoon-cli", "start", "--hostname", "0.0.0.0", "--daemon-off", "--data", {{#filePaths}}"{{.}}", {{/filePaths}}"--container"{{{args}}}]

# Usage: docker run -p <host_port>:<container_port> mockoon-test`;
