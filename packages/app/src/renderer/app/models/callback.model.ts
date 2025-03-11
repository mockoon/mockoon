export type CallbackTabsNameType = 'SPEC' | 'USAGE';

export type CallbackSpecTabNameType = 'BODY' | 'HEADERS';

export type CallbackResponseUsage = {
  responseUUID: string;
  label: string;
};

export type CallbackUsage = {
  routeUUID: string;
  label: string;
  responses: CallbackResponseUsage[];
};
