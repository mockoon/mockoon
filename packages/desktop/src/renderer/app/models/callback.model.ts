import { Callback } from '@mockoon/commons';

export type CallbackTabsNameType = 'SPEC' | 'USAGE';

export type CallbackResponseUsage = {
  responseUUID: string;
  label: string;
};

export type CallbackUsage = {
  routeUUID: string;
  label: string;
  responses: CallbackResponseUsage[];
};

export type CallbackProperties = { [T in keyof Callback]?: Callback[T] };
