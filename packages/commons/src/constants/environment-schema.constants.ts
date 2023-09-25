import * as Joi from 'joi';
import { HighestMigrationId } from '../libs/migrations';
import { GenerateDatabucketID, generateUUID } from '../libs/utils';
import {
  DataBucket,
  Environment,
  EnvironmentTLSOptions
} from '../models/environment.model';
import { Folder, FolderChild } from '../models/folder.model';
import {
  BodyTypes,
  Header,
  Methods,
  ResponseMode,
  ResponseRule,
  Route,
  RouteResponse,
  RouteType
} from '../models/route.model';

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
  data: []
};

export const FolderDefault: Folder = {
  get uuid() {
    return generateUUID();
  },
  name: 'New folder',
  collapsed: false,
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
  enabled: true,
  responseMode: null
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
  crudKey: 'id'
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
    return GenerateDatabucketID();
  },
  name: 'New data',
  documentation: '',
  value: ''
};

const UUIDSchema = Joi.string()
  .uuid()
  .failover(() => generateUUID())
  .required();

const HeaderSchema = Joi.object<Header, true>({
  key: Joi.string().allow('').required(),
  value: Joi.string().allow('').required()
});

const DataSchema = Joi.object<DataBucket, true>({
  uuid: UUIDSchema,
  id: Joi.string().allow('').failover(DataBucketDefault.id).required(),
  name: Joi.string().allow('').failover(DataBucketDefault.name).required(),
  documentation: Joi.string()
    .allow('')
    .failover(DataBucketDefault.documentation)
    .required(),
  value: Joi.string().allow('').failover(DataBucketDefault.value).required()
})
  .failover(EnvironmentDefault.data)
  .default(EnvironmentDefault.data)
  .options({ stripUnknown: true });

const TLSOptionsSchema = Joi.object<EnvironmentTLSOptions, true>({
  enabled: Joi.boolean()
    .failover(EnvironmentDefault.tlsOptions.enabled)
    .required(),
  type: Joi.string()
    .valid('CERT', 'PFX')
    .failover(EnvironmentDefault.tlsOptions.type)
    .required(),
  pfxPath: Joi.string()
    .allow('')
    .failover(EnvironmentDefault.tlsOptions.pfxPath)
    .required(),
  certPath: Joi.string()
    .allow('')
    .failover(EnvironmentDefault.tlsOptions.certPath)
    .required(),
  keyPath: Joi.string()
    .allow('')
    .failover(EnvironmentDefault.tlsOptions.keyPath)
    .required(),
  caPath: Joi.string()
    .allow('')
    .failover(EnvironmentDefault.tlsOptions.caPath)
    .required(),
  passphrase: Joi.string()
    .allow('')
    .failover(EnvironmentDefault.tlsOptions.passphrase)
    .required()
})
  .failover(EnvironmentDefault.tlsOptions)
  .default(EnvironmentDefault.tlsOptions)
  .options({ stripUnknown: true });

const RouteResponseRuleSchema = Joi.object<ResponseRule, true>({
  target: Joi.string()
    .valid('body', 'query', 'header', 'params', 'request_number', 'cookie')
    .failover(ResponseRuleDefault.target)
    .required(),
  modifier: Joi.string()
    .allow('')
    .failover(ResponseRuleDefault.modifier)
    .required(),
  value: Joi.string().allow('').failover(ResponseRuleDefault.value).required(),
  invert: Joi.boolean().failover(ResponseRuleDefault.invert).required(),
  operator: Joi.string()
    .valid('equals', 'regex', 'regex_i', 'null', 'empty_array')
    .failover(ResponseRuleDefault.operator)
    .required()
});

const RouteResponseSchema = Joi.object<RouteResponse, true>({
  uuid: UUIDSchema,
  body: Joi.string().allow('').failover(RouteResponseDefault.body).required(),
  latency: Joi.number()
    .min(0)
    .failover(RouteResponseDefault.latency)
    .required(),
  statusCode: Joi.number()
    .min(100)
    .max(999)
    .failover(RouteResponseDefault.statusCode)
    .required(),
  label: Joi.string().allow('').failover(RouteResponseDefault.label).required(),
  headers: Joi.array()
    .items(HeaderSchema, Joi.any().strip())
    .failover(RouteResponseDefault.headers)
    .required(),
  bodyType: Joi.string()
    .valid(BodyTypes.INLINE, BodyTypes.DATABUCKET, BodyTypes.FILE)
    .failover(RouteResponseDefault.bodyType)
    .required(),
  filePath: Joi.string()
    .allow('')
    .failover(RouteResponseDefault.filePath)
    .required(),
  databucketID: Joi.string()
    .allow('')
    .failover(RouteResponseDefault.databucketID)
    .required(),
  sendFileAsBody: Joi.boolean()
    .failover(RouteResponseDefault.sendFileAsBody)
    .required(),
  rules: Joi.array()
    .items(RouteResponseRuleSchema, Joi.any().strip())
    .failover(RouteResponseDefault.rules)
    .required(),
  rulesOperator: Joi.string()
    .valid('OR', 'AND')
    .failover(RouteResponseDefault.rulesOperator)
    .required(),
  disableTemplating: Joi.boolean()
    .failover(RouteResponseDefault.disableTemplating)
    .required(),
  fallbackTo404: Joi.boolean()
    .failover(RouteResponseDefault.fallbackTo404)
    .required(),
  default: Joi.boolean().failover(RouteResponseDefault.default).required(),
  crudKey: Joi.string().failover(RouteResponseDefault.crudKey).required()
});

export const FolderChildSchema = Joi.object<FolderChild, true>({
  type: Joi.string()
    .valid('route', 'folder')
    .required()
    .options({ stripUnknown: true }),
  uuid: UUIDSchema
});

export const FolderSchema = Joi.object<Folder, true>({
  uuid: UUIDSchema,
  name: Joi.string().allow('').failover(FolderDefault.name).required(),
  collapsed: Joi.boolean().failover(FolderDefault.collapsed).required(),
  children: Joi.array()
    .items(FolderChildSchema, Joi.any().strip())
    .failover(FolderDefault.children)
    .required()
}).options({ stripUnknown: true });

export const RouteSchema = Joi.object<Route, true>({
  uuid: UUIDSchema,
  type: Joi.string()
    .valid(RouteType.HTTP, RouteType.CRUD)
    .failover(RouteDefault.type)
    .required(),
  documentation: Joi.string()
    .allow('')
    .failover(RouteDefault.documentation)
    .required(),
  method: Joi.string()
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
    .failover(RouteDefault.method)
    .required(),
  endpoint: Joi.string().allow('').failover(RouteDefault.endpoint).required(),
  responses: Joi.array()
    .items(RouteResponseSchema, Joi.any().strip())
    .failover(RouteDefault.responses)
    .required(),
  enabled: Joi.boolean().failover(RouteDefault.enabled).required(),
  responseMode: Joi.string()
    .allow(null)
    .valid(
      ResponseMode.RANDOM,
      ResponseMode.SEQUENTIAL,
      ResponseMode.DISABLE_RULES,
      ResponseMode.FALLBACK
    )
    .failover(RouteDefault.responseMode)
    .required()
});

export const EnvironmentSchema = Joi.object<Environment, true>({
  uuid: UUIDSchema,
  lastMigration: Joi.number()
    .failover(EnvironmentDefault.lastMigration)
    .required(),
  name: Joi.string().allow('').failover(EnvironmentDefault.name).required(),
  endpointPrefix: Joi.string()
    .allow('')
    .failover(EnvironmentDefault.endpointPrefix)
    .required(),
  latency: Joi.number().min(0).failover(EnvironmentDefault.latency).required(),
  port: Joi.number()
    .min(0)
    .max(65535)
    .failover(EnvironmentDefault.port)
    .required(),
  hostname: Joi.string()
    .allow('')
    .failover(EnvironmentDefault.hostname)
    .required(),
  rootChildren: Joi.array()
    .items(FolderChildSchema, Joi.any().strip())
    .failover(EnvironmentDefault.rootChildren)
    .required(),
  folders: Joi.array()
    .items(FolderSchema, Joi.any().strip())
    .failover(EnvironmentDefault.folders)
    .required(),
  routes: Joi.array()
    .items(RouteSchema, Joi.any().strip())
    .failover(EnvironmentDefault.routes)
    .required(),
  proxyMode: Joi.boolean().failover(EnvironmentDefault.proxyMode).required(),
  proxyHost: Joi.string()
    .allow('')
    .failover(EnvironmentDefault.proxyHost)
    .required(),
  proxyRemovePrefix: Joi.boolean()
    .failover(EnvironmentDefault.proxyRemovePrefix)
    .required(),
  tlsOptions: TLSOptionsSchema,
  cors: Joi.boolean().failover(EnvironmentDefault.cors).required(),
  headers: Joi.array()
    .items(HeaderSchema, Joi.any().strip())
    .failover(EnvironmentDefault.headers)
    .required(),
  proxyReqHeaders: Joi.array()
    .items(HeaderSchema, Joi.any().strip())
    .failover(EnvironmentDefault.proxyReqHeaders)
    .required(),
  proxyResHeaders: Joi.array()
    .items(HeaderSchema, Joi.any().strip())
    .failover(EnvironmentDefault.proxyResHeaders)
    .required(),
  data: Joi.array()
    .items(DataSchema, Joi.any().strip())
    .failover(EnvironmentDefault.data)
    .required()
})
  .failover(EnvironmentDefault)
  .default(EnvironmentDefault)
  .options({ stripUnknown: true });
