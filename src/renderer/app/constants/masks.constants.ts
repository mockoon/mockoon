import { Validation } from 'src/renderer/app/models/common.model';

export const StatusCodeValidation: Validation = {
  mask: 'abb',
  maskPatterns: {
    a: { pattern: new RegExp(/[1-9]/) },
    b: { pattern: new RegExp(/[0-9]/) }
  },
  min: 100,
  max: 999
};
