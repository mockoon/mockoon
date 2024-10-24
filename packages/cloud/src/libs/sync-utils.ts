import { Environment } from '@mockoon/commons';

export const getEnvironmentByteSize = (environment: Environment): number =>
  new Blob([JSON.stringify(environment)]).size;
