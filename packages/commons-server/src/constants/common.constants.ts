export const ParsedXMLBodyMimeTypes = [
  'application/xml',
  'application/soap+xml',
  'text/xml'
];

export const ParsedBodyMimeTypes = [
  'application/json',
  'application/x-www-form-urlencoded',
  ...ParsedXMLBodyMimeTypes
];
