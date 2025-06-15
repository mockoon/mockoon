import * as Joi from 'joi';
import { HighestMigrationId } from '../libs/migrations';
import {
  Callback,
  DataBucket,
  Environment,
  EnvironmentTLSOptions
} from '../models/environment.model';
import { Folder, FolderChild } from '../models/folder.model';
import {
  BodyTypes,
  CallbackInvocation,
  Header,
  Methods,
  ResponseMode,
  ResponseRule,
  Route,
  RouteResponse,
  RouteType,
  StreamingMode
} from '../models/route.model';
import { GenerateUniqueID, generateUUID } from '../utils/utils';

export const EnvironmentDefault: Environment = {
  get uuid() {
    return generateUUID();
  },
  lastMigration: HighestMigrationId,
  name: 'New environment',
  endpointPrefix: '',
  latency: 0,
  port: 3000,
  hostname: '',
  folders: [],
  routes: [],
  rootChildren: [],
  proxyMode: false,
  proxyHost: '',
  proxyRemovePrefix: false,
  tlsOptions: {
    enabled: false,
    type: 'CERT',
    pfxPath: '',
    certPath: '',
    keyPath: '',
    caPath: '',
    passphrase: ''
  },
  cors: true,
  headers: [],
  proxyReqHeaders: [],
  proxyResHeaders: [],
  data: [],
  callbacks: []
};

export const FolderDefault: Folder = {
  get uuid() {
    return generateUUID();
  },
  name: 'New folder',
  children: []
};

export const RouteDefault: Route = {
  get uuid() {
    return generateUUID();
  },
  type: RouteType.HTTP,
  documentation: '',
  method: Methods.get,
  endpoint: '',
  responses: [],
  responseMode: null,
  streamingMode: null,
  streamingInterval: 0
};

export const RouteResponseDefault: RouteResponse = {
  get uuid() {
    return generateUUID();
  },
  body: '{}',
  latency: 0,
  statusCode: 200,
  label: '',
  headers: [],
  bodyType: BodyTypes.INLINE,
  filePath: '',
  databucketID: '',
  sendFileAsBody: false,
  rules: [],
  rulesOperator: 'OR',
  disableTemplating: false,
  fallbackTo404: false,
  default: false,
  crudKey: 'id',
  callbacks: []
};

export const CallbackDefault: Callback = {
  get uuid() {
    return generateUUID();
  },
  get id() {
    return GenerateUniqueID();
  },
  uri: '',
  name: 'Callback',
  documentation: '',
  method: Methods.post,
  headers: [],
  bodyType: BodyTypes.INLINE,
  body: '',
  databucketID: '',
  filePath: '',
  sendFileAsBody: true
};

export const ResponseCallbackDefault: CallbackInvocation = {
  uuid: '',
  latency: 0
};

export const ResponseRuleDefault: ResponseRule = {
  target: 'body',
  modifier: '',
  value: '',
  invert: false,
  operator: 'equals'
};

export const HeaderDefault: Header = {
  key: '',
  value: ''
};

export const DataBucketDefault: DataBucket = {
  get uuid() {
    return generateUUID();
  },
  get id() {
    return GenerateUniqueID();
  },
  name: 'New data',
  documentation: '',
  value: '[\n]'
};

const conditionalFailover = (fix: boolean, schema: any, failoverValue: any) => {
  if (fix) {
    return schema.failover(failoverValue);
  }

  return schema;
};

const conditionalStripUnknown = (fix: boolean) => {
  if (fix) {
    return [Joi.any().strip()];
  }

  return [];
};

const UUIDSchemaBuilder = (fix: boolean) =>
  conditionalFailover(fix, Joi.string().uuid().required(), () =>
    generateUUID()
  );

const HeaderSchemaBuilder = (fix: boolean) =>
  conditionalFailover(
    fix,
    Joi.object<Header, true>({
      key: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        HeaderDefault.key
      ),
      value: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        HeaderDefault.value
      )
    }).options({ stripUnknown: true }),
    HeaderDefault
  );

const DataSchemaBuilder = (fix: boolean) =>
  conditionalFailover(
    fix,
    Joi.object<DataBucket, true>({
      uuid: UUIDSchemaBuilder(fix),
      id: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        DataBucketDefault.id
      ),
      name: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        DataBucketDefault.name
      ),
      documentation: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        DataBucketDefault.documentation
      ),
      value: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        DataBucketDefault.value
      )
    })
      .default(EnvironmentDefault.data)
      .options({ stripUnknown: true }),
    EnvironmentDefault.data
  );

const TLSOptionsSchemaBuilder = (fix: boolean) =>
  conditionalFailover(
    fix,
    Joi.object<EnvironmentTLSOptions, true>({
      enabled: conditionalFailover(
        fix,
        Joi.boolean().strict().required(),
        EnvironmentDefault.tlsOptions.enabled
      ),
      type: conditionalFailover(
        fix,
        Joi.string().valid('CERT', 'PFX').required(),
        EnvironmentDefault.tlsOptions.type
      ),
      pfxPath: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        EnvironmentDefault.tlsOptions.pfxPath
      ),
      certPath: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        EnvironmentDefault.tlsOptions.certPath
      ),
      keyPath: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        EnvironmentDefault.tlsOptions.keyPath
      ),
      caPath: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        EnvironmentDefault.tlsOptions.caPath
      ),
      passphrase: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        EnvironmentDefault.tlsOptions.passphrase
      )
    })
      .default(EnvironmentDefault.tlsOptions)
      .options({ stripUnknown: true }),
    EnvironmentDefault.tlsOptions
  );

const RouteResponseRuleSchemaBuilder = (fix: boolean) =>
  conditionalFailover(
    fix,
    Joi.object<ResponseRule, true>({
      target: conditionalFailover(
        fix,
        Joi.string()
          .valid(
            'body',
            'query',
            'header',
            'cookie',
            'params',
            'path',
            'method',
            'request_number',
            'global_var',
            'data_bucket',
            'templating'
          )
          .required(),
        ResponseRuleDefault.target
      ),
      modifier: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        ResponseRuleDefault.modifier
      ),
      value: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        ResponseRuleDefault.value
      ),
      invert: conditionalFailover(
        fix,
        Joi.boolean().strict().required(),
        ResponseRuleDefault.invert
      ),
      operator: conditionalFailover(
        fix,
        Joi.string()
          .valid(
            'equals',
            'regex',
            'regex_i',
            'null',
            'empty_array',
            'array_includes',
            'valid_json_schema'
          )
          .required(),
        ResponseRuleDefault.operator
      )
    }).options({
      stripUnknown: true
    }),
    ResponseRuleDefault
  );

const CallbackSchemaBuilder = (fix: boolean) =>
  conditionalFailover(
    fix,
    Joi.object<Callback, true>({
      uuid: UUIDSchemaBuilder(fix),
      id: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        CallbackDefault.id
      ),
      name: conditionalFailover(
        fix,
        Joi.string().default('').required(),
        CallbackDefault.name
      ),
      documentation: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        CallbackDefault.documentation
      ),
      method: conditionalFailover(
        fix,
        Joi.string()
          .valid(
            Methods.get,
            Methods.post,
            Methods.put,
            Methods.patch,
            Methods.delete,
            Methods.head,
            Methods.options,
            Methods.propfind,
            Methods.proppatch,
            Methods.move,
            Methods.copy,
            Methods.mkcol,
            Methods.lock,
            Methods.unlock
          )
          .required(),
        CallbackDefault.method
      ),
      uri: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        CallbackDefault.uri
      ),
      headers: conditionalFailover(
        fix,
        Joi.array()
          .items(HeaderSchemaBuilder(fix), ...conditionalStripUnknown(fix))
          .required(),
        CallbackDefault.headers
      ),
      body: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        CallbackDefault.body
      ),
      bodyType: conditionalFailover(
        fix,
        Joi.string()
          .valid(BodyTypes.INLINE, BodyTypes.DATABUCKET, BodyTypes.FILE)
          .required(),
        CallbackDefault.bodyType
      ),
      filePath: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        CallbackDefault.filePath
      ),
      sendFileAsBody: conditionalFailover(
        fix,
        Joi.boolean().strict().required(),
        CallbackDefault.sendFileAsBody
      ),
      databucketID: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        CallbackDefault.databucketID
      )
    })
      .default(EnvironmentDefault.callbacks)
      .options({ stripUnknown: true }),
    EnvironmentDefault.callbacks
  );

const CallbackInvocationSchemaBuilder = (fix: boolean) =>
  Joi.object<CallbackInvocation, true>({
    uuid: UUIDSchemaBuilder(fix),
    latency: Joi.number().default(0)
  }).options({
    stripUnknown: true
  });

const RouteResponseSchemaBuilder = (fix: boolean) =>
  conditionalFailover(
    fix,
    Joi.object<RouteResponse, true>({
      uuid: UUIDSchemaBuilder(fix),
      body: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        RouteResponseDefault.body
      ),
      latency: conditionalFailover(
        fix,
        Joi.number().min(0).required(),
        RouteResponseDefault.latency
      ),
      statusCode: conditionalFailover(
        fix,
        Joi.number().min(100).max(999).required(),
        RouteResponseDefault.statusCode
      ),
      label: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        RouteResponseDefault.label
      ),
      headers: conditionalFailover(
        fix,
        Joi.array()
          .items(HeaderSchemaBuilder(fix), ...conditionalStripUnknown(fix))
          .required(),
        RouteResponseDefault.headers
      ),
      bodyType: conditionalFailover(
        fix,
        Joi.string()
          .valid(BodyTypes.INLINE, BodyTypes.DATABUCKET, BodyTypes.FILE)
          .required(),
        RouteResponseDefault.bodyType
      ),
      filePath: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        RouteResponseDefault.filePath
      ),
      databucketID: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        RouteResponseDefault.databucketID
      ),
      sendFileAsBody: conditionalFailover(
        fix,
        Joi.boolean().strict().required(),
        RouteResponseDefault.sendFileAsBody
      ),
      rules: conditionalFailover(
        fix,
        Joi.array()
          .items(
            RouteResponseRuleSchemaBuilder(fix),
            ...conditionalStripUnknown(fix)
          )
          .required(),
        RouteResponseDefault.rules
      ),
      rulesOperator: conditionalFailover(
        fix,
        Joi.string().valid('OR', 'AND').required(),
        RouteResponseDefault.rulesOperator
      ),
      disableTemplating: conditionalFailover(
        fix,
        Joi.boolean().strict().required(),
        RouteResponseDefault.disableTemplating
      ),
      fallbackTo404: conditionalFailover(
        fix,
        Joi.boolean().strict().required(),
        RouteResponseDefault.fallbackTo404
      ),
      default: conditionalFailover(
        fix,
        Joi.boolean().strict().required(),
        RouteResponseDefault.default
      ),
      crudKey: conditionalFailover(
        fix,
        Joi.string().required(),
        RouteResponseDefault.crudKey
      ),
      callbacks: conditionalFailover(
        fix,
        Joi.array()
          .items(
            CallbackInvocationSchemaBuilder(fix),
            ...conditionalStripUnknown(fix)
          )
          .required(),
        RouteResponseDefault.callbacks
      )
    }).options({
      stripUnknown: true
    }),
    RouteResponseDefault
  );

const FolderChildSchemaBuilder = (fix: boolean) =>
  Joi.object<FolderChild, true>({
    uuid: UUIDSchemaBuilder(fix),
    type: Joi.string().valid('route', 'folder').required()
  });

const FolderSchemaBuilder = (fix: boolean) =>
  conditionalFailover(
    fix,
    Joi.object<Folder, true>({
      uuid: UUIDSchemaBuilder(fix),
      name: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        FolderDefault.name
      ),
      children: conditionalFailover(
        fix,
        Joi.array()
          .items(FolderChildSchemaBuilder(fix), ...conditionalStripUnknown(fix))
          .required(),
        FolderDefault.children
      )
    }).options({ stripUnknown: true }),
    FolderDefault
  );

const RouteSchemaBuilder = (fix: boolean) =>
  conditionalFailover(
    fix,
    Joi.object<Route, true>({
      uuid: UUIDSchemaBuilder(fix),
      type: conditionalFailover(
        fix,
        Joi.string()
          .valid(RouteType.HTTP, RouteType.CRUD, RouteType.WS)
          .required(),
        RouteDefault.type
      ),
      documentation: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        RouteDefault.documentation
      ),
      method: conditionalFailover(
        fix,
        Joi.string()
          .allow('')
          .valid(
            Methods.all,
            Methods.get,
            Methods.post,
            Methods.put,
            Methods.patch,
            Methods.delete,
            Methods.head,
            Methods.options,
            Methods.propfind,
            Methods.proppatch,
            Methods.move,
            Methods.copy,
            Methods.mkcol,
            Methods.lock,
            Methods.unlock
          )
          .required(),
        RouteDefault.method
      ),
      endpoint: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        RouteDefault.endpoint
      ),
      responses: conditionalFailover(
        fix,
        Joi.array()
          .items(
            RouteResponseSchemaBuilder(fix),
            ...conditionalStripUnknown(fix)
          )
          .required(),
        RouteDefault.responses
      ),
      responseMode: conditionalFailover(
        fix,
        Joi.string()
          .allow(null)
          .valid(
            ResponseMode.RANDOM,
            ResponseMode.SEQUENTIAL,
            ResponseMode.DISABLE_RULES,
            ResponseMode.FALLBACK
          )
          .required(),
        RouteDefault.responseMode
      ),
      streamingMode: conditionalFailover(
        fix,
        Joi.string()
          .allow(null)
          .valid(StreamingMode.UNICAST, StreamingMode.BROADCAST)
          .required(),
        RouteDefault.streamingMode
      ),
      streamingInterval: conditionalFailover(
        fix,
        Joi.number().min(0).required(),
        RouteDefault.streamingInterval
      )
    }).options({
      stripUnknown: true
    }),
    RouteDefault
  );

const EnvironmentSchemaBuilder = (fix: boolean) =>
  conditionalFailover(
    fix,
    Joi.object<Environment, true>({
      uuid: UUIDSchemaBuilder(fix),
      lastMigration: conditionalFailover(
        fix,
        Joi.number().required(),
        EnvironmentDefault.lastMigration
      ),
      name: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        EnvironmentDefault.name
      ),
      endpointPrefix: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        EnvironmentDefault.endpointPrefix
      ),
      latency: conditionalFailover(
        fix,
        Joi.number().min(0).required(),
        EnvironmentDefault.latency
      ),
      port: conditionalFailover(
        fix,
        Joi.number().min(0).max(65535).required(),
        EnvironmentDefault.port
      ),
      hostname: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        EnvironmentDefault.hostname
      ),
      rootChildren: conditionalFailover(
        fix,
        Joi.array()
          .items(FolderChildSchemaBuilder(fix), ...conditionalStripUnknown(fix))
          .required(),
        EnvironmentDefault.rootChildren
      ),
      folders: conditionalFailover(
        fix,
        Joi.array()
          .items(FolderSchemaBuilder(fix), ...conditionalStripUnknown(fix))
          .required(),
        EnvironmentDefault.folders
      ),
      routes: conditionalFailover(
        fix,
        Joi.array()
          .items(RouteSchemaBuilder(fix), ...conditionalStripUnknown(fix))
          .required(),
        EnvironmentDefault.routes
      ),
      proxyMode: conditionalFailover(
        fix,
        Joi.boolean().strict().required(),
        EnvironmentDefault.proxyMode
      ),
      proxyHost: conditionalFailover(
        fix,
        Joi.string().allow('').required(),
        EnvironmentDefault.proxyHost
      ),
      proxyRemovePrefix: conditionalFailover(
        fix,
        Joi.boolean().strict().required(),
        EnvironmentDefault.proxyRemovePrefix
      ),
      tlsOptions: TLSOptionsSchemaBuilder(fix),
      cors: conditionalFailover(
        fix,
        Joi.boolean().strict().required(),
        EnvironmentDefault.cors
      ),
      headers: conditionalFailover(
        fix,
        Joi.array()
          .items(HeaderSchemaBuilder(fix), ...conditionalStripUnknown(fix))
          .required(),
        EnvironmentDefault.headers
      ),
      proxyReqHeaders: conditionalFailover(
        fix,
        Joi.array()
          .items(HeaderSchemaBuilder(fix), ...conditionalStripUnknown(fix))
          .required(),
        EnvironmentDefault.proxyReqHeaders
      ),
      proxyResHeaders: conditionalFailover(
        fix,
        Joi.array()
          .items(HeaderSchemaBuilder(fix), ...conditionalStripUnknown(fix))
          .required(),
        EnvironmentDefault.proxyResHeaders
      ),
      data: conditionalFailover(
        fix,
        Joi.array()
          .items(DataSchemaBuilder(fix), ...conditionalStripUnknown(fix))
          .required(),
        EnvironmentDefault.data
      ),
      callbacks: conditionalFailover(
        fix,
        Joi.array()
          .items(CallbackSchemaBuilder(fix), ...conditionalStripUnknown(fix))
          .required(),
        EnvironmentDefault.callbacks
      )
    })
      .default(EnvironmentDefault)
      .options({
        stripUnknown: true
      }),
    EnvironmentDefault
  );

export const RouteSchema = RouteSchemaBuilder(true);
export const EnvironmentSchema = EnvironmentSchemaBuilder(true);
export const EnvironmentSchemaNoFix = EnvironmentSchemaBuilder(false);
