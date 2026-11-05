export const requestHelperNames = [
  'bodyRaw',
  'body',
  'method',
  'ip',
  'urlParam',
  'urlParams',
  'queryParam',
  'queryParamRaw',
  'queryParams',
  'header',
  'headers',
  'cookie',
  'baseUrl',
  'hostname'
] as const;

const requestHelpersRegex = new RegExp(
  `{{2,3}[#(~\\s\\w ]*((?<![\\w])${requestHelperNames.join('|')})[)} ~]+`
);

export const hasRequestHelpers = (template: string): boolean =>
  requestHelpersRegex.test(template);
