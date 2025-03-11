export const helpersAutocompletions = [
  { caption: 'body', value: "{{body 'path'}}", meta: '' },
  { caption: 'bodyRaw', value: "{{bodyRaw 'path'}}", meta: '' },
  {
    caption: 'queryParam',
    value: "{{queryParam 'path'}}",
    meta: ''
  },
  {
    caption: 'queryParamRaw',
    value: "{{queryParamRaw 'path'}}",
    meta: ''
  },
  { caption: 'urlParam', value: "{{urlParam 'paramName'}}", meta: '' },
  { caption: 'cookie', value: "{{cookie 'cookie_name'}}", meta: '' },
  { caption: 'header', value: "{{header 'Header-Name'}}", meta: '' },
  { caption: 'hostname', value: '{{hostname}}', meta: '' },
  { caption: 'ip', value: '{{ip}}', meta: '' },
  { caption: 'method', value: '{{method}}', meta: '' },
  { caption: 'baseUrl', value: '{{baseUrl}}', meta: '' },
  { caption: 'data', value: "{{data 'nameOrId' 'path'}}", meta: '' },
  { caption: 'dataRaw', value: "{{dataRaw 'nameOrId' 'path'}}", meta: '' },
  {
    caption: 'setData',
    value: "{{setData 'nameOrId' 'path' 'newValue' 'operator'}}",
    meta: ''
  },
  { caption: 'faker', value: "{{faker 'namespace.method'}}", meta: '' },
  { caption: 'repeat', value: '{{#repeat min max}}\n{{/repeat}}', meta: '' },
  {
    caption: 'switch',
    value:
      '{{#switch var}}\n  {{#case value}}{{/case}}\n  {{#case value}}{{/case}}\n  {{#default}}{{/default}}\n{{/switch}}',
    meta: ''
  },
  { caption: 'array', value: "{{array 'item1' 'item2' 'item3'}}", meta: '' },
  { caption: 'sort', value: "{{sort (array ...) 'asc'}}", meta: '' },
  { caption: 'sortBy', value: "{{sort (array ...) 'key' 'asc'}}", meta: '' },
  { caption: 'oneOf', value: '{{oneOf arr}}', meta: '' },
  { caption: 'someOf', value: '{{someOf arr}}', meta: '' },
  { caption: 'join', value: '{{join arr}}', meta: '' },
  { caption: 'slice', value: '{{slice arr}}', meta: '' },
  { caption: 'len', value: '{{len arr}}', meta: '' },
  { caption: 'add', value: '{{add num num}}', meta: '' },
  { caption: 'subtract', value: '{{subtract num num}}', meta: '' },
  { caption: 'multiply', value: '{{multiply num num}}', meta: '' },
  { caption: 'divide', value: '{{divide num num}}', meta: '' },
  { caption: 'modulo', value: '{{modulo num num}}', meta: '' },
  { caption: 'ceil', value: '{{ceil num}}', meta: '' },
  { caption: 'floor', value: '{{floor num}}', meta: '' },
  { caption: 'eq', value: '{{eq num num}}', meta: '' },
  { caption: 'gt', value: '{{gt num num}}', meta: '' },
  { caption: 'gte', value: '{{gte num num}}', meta: '' },
  { caption: 'lt', value: '{{lt num num}}', meta: '' },
  { caption: 'lte', value: '{{lte num num}}', meta: '' },
  { caption: 'toFixed', value: '{{toFixed num digits}}', meta: '' },
  { caption: 'round', value: '{{round num}}', meta: '' },
  { caption: 'newline', value: '{{newline}}', meta: '' },
  { caption: 'base64', value: '{{base64 value}}', meta: '' },
  { caption: 'base64Decode', value: '{{base64Decode string}}', meta: '' },
  { caption: 'objectId', value: '{{objectId}}', meta: '' },
  { caption: 'objectMerge', value: '{{objectMerge object object}}', meta: '' },
  { caption: 'getVar', value: "{{getVar 'varname'}}", meta: '' },
  { caption: 'setVar', value: "{{setVar 'varname' 'value'}}", meta: '' },
  {
    caption: 'getGlobalVar',
    value: "{{getGlobalVar 'varname'}}",
    meta: ''
  },
  {
    caption: 'setGlobalVar',
    value: "{{setGlobalVar 'varname' 'value'}}",
    meta: ''
  },
  { caption: 'getEnvVar', value: "{{getEnvVar 'varname'}}", meta: '' },
  { caption: 'includes', value: '{{includes string search}}', meta: '' },
  { caption: 'substr', value: '{{substr string startIndex length}}', meta: '' },
  { caption: 'lowercase', value: '{{lowercase string}}', meta: '' },
  { caption: 'uppercase', value: '{{uppercase string}}', meta: '' },
  { caption: 'split', value: '{{split string}}', meta: '' },
  { caption: 'stringify', value: '{{stringify value}}', meta: '' },
  { caption: 'jsonParse', value: "{{jsonParse 'JSON string'}}", meta: '' },
  { caption: 'concat', value: '{{concat value value}}', meta: '' },
  { caption: 'jwtPayload', value: "{{jwtPayload token 'key'}}", meta: '' },
  { caption: 'jwtHeader', value: "{{jwtHeader token 'key'}}", meta: '' },
  { caption: 'filter', value: "{{filter array 'key'}}", meta: '' },
  {
    caption: 'indexOf',
    value: '{{indexOf value search startIndex}}',
    meta: ''
  },
  { caption: 'parseInt', value: '{{parseInt string}}', meta: '' },
  { caption: 'now', value: "{{now 'format'}}", meta: '' },
  {
    caption: 'dateTimeShift',
    value:
      "{{dateTimeShift date='date' format='format' years=num months=num days=num hours=num minutes=num seconds=num}}",
    meta: ''
  },
  {
    caption: 'date',
    value: "{{date 'from_date' 'to_date' 'format'}}",
    meta: ''
  },
  {
    caption: 'time',
    value: "{{time 'from_time' 'to_time' 'format'}}",
    meta: ''
  },
  {
    caption: 'dateFormat',
    value: "{{dateFormat 'date' 'format'}}",
    meta: ''
  },
  {
    caption: 'isValidDate',
    value: "{{isValidDate 'date'}}",
    meta: ''
  },
  { caption: 'int', value: '{{int min max}}', meta: '' },
  { caption: 'float', value: '{{float min max}}', meta: '' },
  { caption: 'boolean', value: '{{boolean}}', meta: '' },
  { caption: 'title', value: '{{title sex}}', meta: '' },
  { caption: 'firstName', value: '{{firstName}}', meta: '' },
  { caption: 'lastName', value: '{{lastName}}', meta: '' },
  { caption: 'company', value: '{{company}}', meta: '' },
  { caption: 'domain', value: '{{domain}}', meta: '' },
  { caption: 'tld', value: '{{tld}}', meta: '' },
  { caption: 'email', value: '{{email}}', meta: '' },
  { caption: 'street', value: '{{street}}', meta: '' },
  { caption: 'city', value: '{{city}}', meta: '' },
  { caption: 'country', value: '{{country}}', meta: '' },
  { caption: 'countryCode', value: '{{countryCode}}', meta: '' },
  { caption: 'zipcode', value: '{{zipcode}}', meta: '' },
  { caption: 'postcode', value: '{{postcode}}', meta: '' },
  { caption: 'lat', value: '{{lat}}', meta: '' },
  { caption: 'long', value: '{{long}}', meta: '' },
  { caption: 'phone', value: '{{phone}}', meta: '' },
  { caption: 'color', value: '{{color}}', meta: '' },
  { caption: 'hexColor', value: '{{hexColor}}', meta: '' },
  { caption: 'guid', value: '{{guid}}', meta: '' },
  { caption: 'uuid', value: '{{uuid}}', meta: '' },
  { caption: 'ipv4', value: '{{ipv4}}', meta: '' },
  { caption: 'ipv6', value: '{{ipv6}}', meta: '' },
  { caption: 'lorem', value: '{{lorem length}}', meta: '' }
];
