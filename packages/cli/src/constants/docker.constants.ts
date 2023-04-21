export const DOCKER_TEMPLATE = `FROM node:18-alpine

RUN npm install -g @mockoon/cli@{{{version}}}
{{#filePaths}}
COPY {{{.}}} ./{{{.}}}
{{/filePaths}}

# Do not run as root.
RUN adduser --shell /bin/sh --disabled-password --gecos "" mockoon
{{#filePaths}}
RUN chown -R mockoon ./{{{.}}}
{{/filePaths}}
USER mockoon

EXPOSE{{#ports}} {{.}}{{/ports}}

ENTRYPOINT ["mockoon-cli", "start", "--daemon-off", "--data", {{#filePaths}}"{{.}}", {{/filePaths}}"--container"{{{args}}}]

# Usage: docker run -p <host_port>:<container_port> mockoon-test`;
