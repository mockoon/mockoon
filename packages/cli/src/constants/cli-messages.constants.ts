export const CLIMessages = {
  DOCKERIZE_SUCCESS: 'Dockerfile was generated and saved to %s',
  DOCKERIZE_BUILD_COMMAND:
    'Run the following commands to build the image and run the container:\n    cd %s\n    docker build -t %s .\n    docker run -d %s %s',
  DOCKERIZE_PORT_DATA_MISMATCH: 'The number of ports and data files must match',
  DATA_INVALID:
    'This file is not a valid OpenAPI specification (JSON or YAML v2.0.0 and v3.0.0) or Mockoon environment',
  DATA_TOO_OLD_ERROR:
    "These environment's data are too old or not a valid Mockoon environment.\nPlease verify or migrate them using a more recent version of the application",
  DATA_TOO_RECENT_ERROR:
    "These environment's data are too recent and cannot be run with the CLI\nPlease update the CLI with the following command 'npm install -g @mockoon/cli'",
  ENVIRONMENT_NOT_AVAILABLE_ERROR: 'No environments exist in specified file',
  ONLY_ONE_ENVIRONMENT_ALLOWED: 'Only one environment is allowed'
};
