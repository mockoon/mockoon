import * as Joi from 'joi';
import { v4 as uuid } from 'uuid';
import { HighestMigrationId } from '../libs/migrations';
import {
  DataBucket,
  Environment,
  EnvironmentTLSOptions
} from '../models/environment.model';
import {
  Header,
  Methods,
  ResponseMode,
  ResponseRule,
  Route,
  RouteResponse
} from '../models/route.model';

export const EnvironmentDefault: Environment = {
  get uuid() {
    return uuid();
  },
  lastMigration: HighestMigrationId,
  name: 'New environment',
  endpointPrefix: '',
  latency: 0,
  port: 3000,
  hostname: '0.0.0.0',
  routes: [],
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

export const RouteDefault: Route = {
  get uuid() {
    return uuid();
  },
  documentation: '',
  method: Methods.get,
  endpoint: '',
  responses: [],
  enabled: true,
  responseMode: null
};

export const RouteResponseDefault: RouteResponse = {
  get uuid() {
    return uuid();
  },
  body: '{}',
  latency: 0,
  statusCode: 200,
  label: '',
  headers: [],
  filePath: '',
  sendFileAsBody: false,
  rules: [],
  rulesOperator: 'OR',
  disableTemplating: false,
  fallbackTo404: false,
  default: false
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
    return uuid();
  },
  name: 'New Data',
  value: '{}'
};

const UUIDSchema = Joi.string()
  .uuid()
  .failover(() => uuid())
  .required();

const HeaderSchema = Joi.object<Header, true>({
  key: Joi.string().allow('').required(),
  value: Joi.string().allow('').required()
});

const DataSchema = Joi.object<DataBucket, true>({
  uuid: UUIDSchema,
  name: Joi.string().allow('').failover(DataBucketDefault.name).required(),
  value: Joi.string().allow('').failover(DataBucketDefault.name).required()
})
  .failover(EnvironmentDefault.data)
  .default(EnvironmentDefault.data);

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
    .valid('equals', 'regex', 'null', 'empty_array')
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
  filePath: Joi.string()
    .allow('')
    .failover(RouteResponseDefault.filePath)
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
  default: Joi.boolean().failover(RouteResponseDefault.default).required()
});

export const RouteSchema = Joi.object<Route, true>({
  uuid: UUIDSchema,
  documentation: Joi.string()
    .allow('')
    .failover(RouteDefault.documentation)
    .required(),
  method: Joi.string()
    .valid(
      Methods.get,
      Methods.post,
      Methods.put,
      Methods.patch,
      Methods.delete,
      Methods.head,
      Methods.options
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
      ResponseMode.DISABLE_RULES
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
  hostname: Joi.string().failover(EnvironmentDefault.hostname).required(),
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
