export enum Errors {
  JSON_PARSE = 'Error while parsing JSON during the call',
  FILE_NOT_EXISTS = 'This file cannot be served because it does not exists',
  FILE_TYPE_NOT_SUPPORTED = 'This type of file is not supported',
  PORT_INVALID = 'This port is invalid',
  PORT_ALREADY_USED = 'Port is already in use',
  EXPORT_ERROR = 'An error occured while exporting the file',
  IMPORT_ERROR = 'An error occured while importing the file',
  IMPORT_WRONG_CHECKSUM = 'The file is corrupted and cannot be imported'
};
