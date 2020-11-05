/**
 * @deprecated
 */
export enum Errors {
  EXPORT_ERROR = 'An error occured while exporting the file',
  EXPORT_ENVIRONMENT_CLIPBOARD_ERROR = 'An error occured while exporting the environment to the clipboard',
  EXPORT_ROUTE_CLIPBOARD_ERROR = 'An error occured while exporting the route to the clipboard',
  IMPORT_ERROR = 'An error occured while importing the file',
  IMPORT_CLIPBOARD_ERROR = 'An error occured while importing from the clipboard',
  IMPORT_WRONG_VERSION = 'This file version is not supported yet',
  IMPORT_INCOMPATIBLE_VERSION = 'Some routes were not imported. Routes can only be exported to or imported in the same application version (file version: {fileVersion})'
}
