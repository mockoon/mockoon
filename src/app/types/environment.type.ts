import { Header, Route } from 'src/app/types/route.type';

export type Environment = {
  uuid: string;
  lastMigration: number;
  name: string;
  port: number;
  endpointPrefix: string;
  latency: number;
  routes: Route[];
  proxyMode: boolean;
  proxyHost: string;
  proxyReqHeaders: Header[];
  proxyResHeaders: Header[];
  https: boolean;
  cors: boolean;
  headers: Header[];
};

export type Environments = Environment[];

export type CurrentEnvironment = { environment: Environment, index: number };

export type EnvironmentProperties = { [T in keyof Environment]?: Environment[T] };
