import { Environment } from '@mockoon/commons';

export const getEnvironmentByteSize = (environment: Environment) =>
  new Blob([JSON.stringify(environment)]).size;
