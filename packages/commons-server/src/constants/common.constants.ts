export const ParsedXMLBodyMimeTypes = [
  'application/xml',
  'application/soap+xml',
  'text/xml'
];

export const ParsedJSONBodyMimeTypes = [
  'application/json',
  /application\/.*\+json/i
];

export const ParsedBodyMimeTypes = [
  ...ParsedJSONBodyMimeTypes,
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  ...ParsedXMLBodyMimeTypes
];
