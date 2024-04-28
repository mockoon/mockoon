export const ServerMessages = {
  PORT_ALREADY_USED: 'Port %d is already in use',
  PORT_INVALID: 'Port %d is invalid or access is denied',
  HOSTNAME_UNKNOWN: 'Unknown hostname/address provided: %s',
  HOSTNAME_UNAVAILABLE: 'Provided hostname/address is not available: %s',
  REQUEST_BODY_PARSE:
    'Error while trying to parse request body with compatible Content-Type (JSON, XML, form-data): %s',
  ROUTE_CREATION_ERROR: 'Error while creating route: %s',
  ROUTE_CREATION_ERROR_REGEX:
    'Error while creating route, regex path is invalid: %s',
  ROUTE_SERVING_ERROR: 'Error while serving the content: %s',
  ROUTE_FILE_SERVING_ERROR: 'Error while serving the file content: %s',
  PROXY_ERROR: 'An error occured while trying to proxy to %s',
  UNKNOWN_SERVER_ERROR: 'An unknown server error occured: %s',
  CERT_FILE_NOT_FOUND: 'Certificate file not found',
  ROUTE_NO_LONGER_EXISTS: 'This route no longer exists',
  HEADER_PARSING_ERROR: 'Header parsing error: %s',
  HEADER_PARSING_ERROR_LIGHT:
    '-- Header parsing error, see logs for more details --',
  SERVER_STARTED: 'Server started on port %d',
  SERVER_STOPPED: 'Server stopped',
  SERVER_CREATING_PROXY: 'Creating proxy to %s',
  CALLBACK_FILE_ERROR: 'Error while attaching file to callback request: %s',
  CALLBACK_ERROR: 'Error while executing callback: %s'
};
