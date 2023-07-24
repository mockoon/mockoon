import { Flags } from '@oclif/core';

// Keep deprecated flags for backward compatibility
export const deprecatedFlags = {
  pname: Flags.string({
    char: 'N',
    required: false,
    default: [],
    multiple: true,
    hidden: true
  }),
  'daemon-off': Flags.boolean({
    char: 'D',
    required: false,
    default: false,
    hidden: true
  })
};

export const commonFlags = {
  help: Flags.help({ char: 'h' }),
  'log-transaction': Flags.boolean({
    char: 't',
    description: 'Log the full HTTP transaction (request and response)',
    default: false
  }),
  data: Flags.string({
    char: 'd',
    description: 'Path(s) or URL(s) to your Mockoon data file(s)',
    required: true,
    multiple: true
  })
};
