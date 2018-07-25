export const DummyJSONHelpers = (request) => {
  return {
    // use params from url /:param1/:param2
    urlParam: (paramName) => {
      return request.params[paramName];
    },
    // use params from query string ?param1=xxx&param2=yyy
    queryParam: (paramName, defaultValue) => {
      return request.query[paramName] || defaultValue;
    },
    // use content from request header
    header: (headerName, defaultValue) => {
      return request.get(headerName) || defaultValue;
    },
    // use request hostname
    hostname: () => {
      return request.hostname;
    },
    // use request ip
    ip: () => {
      return request.ip;
    },
    // use request method
    method: () => {
      return request.method;
    }
  }
};
