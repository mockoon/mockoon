import { join } from 'path';
import { Config } from '../config';

export const Messages = {
  CLI: {
    RUNNING_PROCESSES: 'Running processes:',
    PROCESS_STOPPED: 'Process %d:%s stopped',
    PROCESS_STARTED: 'Mock started at %s://%s:%d (pid: %d, name: %s)',
    DOCKERIZE_SUCCESS: 'Dockerfile was generated and saved to %s',
    DOCKERIZE_BUILD_COMMAND:
      'Run the following commands to build the image and run the container:\n    cd %s\n    docker build -t %s .\n    docker run -d %s %s',
    PROCESS_NAME_USED_ERROR:
      'A process with the name "%s" is already running\nChange the environment\'s name in the data file or run start command with the "--pname" flag',
    PROCESS_START_LOG_ERROR: `Cannot start %s due to errors (see errors in ${join(
      Config.logsPath,
      '%s-error.log'
    )})`,
    NO_RUNNING_PROCESS_FOUND: 'No process found with pid or name "%s"',
    NO_RUNNING_PROCESS: 'No process is running',
    DATA_INVALID:
      'This file is not a valid OpenAPI specification (JSON or YAML v2.0.0 and v3.0.0) or Mockoon environment',
    DATA_TOO_OLD_ERROR:
      "These environment's data are too old or not a valid Mockoon environment.\nPlease verify or migrate them using a more recent version of the application",
    DATA_TOO_RECENT_ERROR:
      "These environment's data are too recent and cannot be run with the CLI\nPlease update the CLI with the following command 'npm install -g @mockoon/cli'",
    ENVIRONMENT_NOT_AVAILABLE_ERROR: 'No environments exist in specified file',
    PORT_ALREADY_USED:
      'Port "%d" is already in use\nChange the environment\'s port in the data file or run start command with the "--port" flag',
    PORT_IS_NOT_VALID: 'Port "%d" is invalid'
  },
  SERVER: {
    STARTED: 'Server started on port %d',
    STOPPED: 'Server stopped',
    CREATING_PROXY: 'Creating proxy to %s'
  }
};
