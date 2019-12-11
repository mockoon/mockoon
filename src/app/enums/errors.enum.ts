export enum Errors {
  JSON_PARSE = 'Error while parsing JSON during the call',
  MISSING_HELPER = 'Error, this helper does not exists: ',
  TEMPLATE_PARSE = 'Error while parsing template',
  INVALID_CONTENT_TYPE = 'Invalid Content-Type provided',
  INVALID_ROUTE_REGEX = 'This route regex path is invalid ',
  FILE_NOT_EXISTS = 'Error, this file does not exists: ',
  FILE_TYPE_NOT_SUPPORTED = 'This type of file is not supported',
  PORT_INVALID = 'This port is invalid',
  PORT_ALREADY_USED = 'Port is already in use',
  EXPORT_ERROR = 'An error occured while exporting the file',
  EXPORT_ENVIRONMENT_CLIPBOARD_ERROR = 'An error occured while exporting the environment to the clipboard',
  EXPORT_ROUTE_CLIPBOARD_ERROR = 'An error occured while exporting the route to the clipboard',
  IMPORT_ERROR = 'An error occured while importing the file',
  IMPORT_CLIPBOARD_ERROR = 'An error occured while importing from the clipboard',
  IMPORT_INCOMPATIBLE_VERSION = 'Some routes were not imported. Routes can only be exported to or imported in the same application version (file version: {fileVersion})'
}
