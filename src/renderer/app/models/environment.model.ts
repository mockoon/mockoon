import { Environment } from '@mockoon/commons';

export type EnvironmentProperties = {
  [T in keyof Environment]?: Environment[T];
};
