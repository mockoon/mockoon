FROM node:16-alpine

ARG version=latest

RUN npm install -g @mockoon/cli@$version

# Install curl for healthcheck
RUN apk --no-cache add curl

# Do not run as root.
RUN adduser --shell /bin/sh --disabled-password --gecos "" mockoon
USER mockoon

EXPOSE 3000

ENTRYPOINT ["mockoon-cli", "start", "--daemon-off"]

# Usage: docker run --mount type=bind,source="$(pwd)"/dataFile.json,target=/data,readonly -p <port>:<port> mockoon-test -d data
# Dockerize command template
CMD ["-d", "/data/dataFile.json"]