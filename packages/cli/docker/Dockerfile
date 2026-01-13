FROM node:24-alpine

ARG version=latest

RUN npm install -g @mockoon/cli@$version

# Install curl for healthcheck and tzdata for timezone support.
RUN apk --no-cache add curl tzdata

# Do not run as root.
RUN adduser --shell /bin/sh --disabled-password --gecos "" mockoon
USER mockoon

EXPOSE 3000

ENTRYPOINT ["mockoon-cli", "start", "--disable-log-to-file"]

# Usage: docker run --mount type=bind,source="$(pwd)"/dataFile.json,target=/data,readonly -p <port>:<port> mockoon-test -d data
