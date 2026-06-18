FROM node:26-alpine

ARG version=latest

RUN npm install -g @mockoon/cli@$version

# Install curl for healthcheck and tzdata for timezone support.
RUN apk --no-cache add curl tzdata

# Do not run as root.
RUN adduser --shell /bin/sh --disabled-password --gecos "" mockoon
USER mockoon

EXPOSE 3000

ENTRYPOINT ["mockoon-cli", "start", "--disable-log-to-file"]

# Usage: docker run -d --mount type=bind,source=/home/your-data-file.json,target=/home/mockoon/data/your-data-file.json,readonly -p 3000:3000 mockoon/cli:latest --data /home/mockoon/data/your-data-file.json --port 3000
