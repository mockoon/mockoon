import { Flags } from '@oclif/core';

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
