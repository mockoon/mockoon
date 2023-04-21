import { Flags } from '@oclif/core';

export const commonFlags = {
  help: Flags.help({ char: 'h' })
};

export const startFlags = {
  data: Flags.string({
    char: 'd',
    description: 'Path(s) or URL(s) to your Mockoon data file(s)',
    required: true,
    multiple: true
  }),
  port: Flags.integer({
    char: 'p',
    description: 'Override environment(s) port(s)',
    multiple: true,
    default: []
  }),
  'log-transaction': Flags.boolean({
    char: 't',
    description: 'Log the full HTTP transaction (request and response)',
    default: false
  }),
  repair: Flags.boolean({
    char: 'r',
    description:
      'If the data file seems too old, or an invalid Mockoon file, migrate/repair without prompting',
    default: false
  })
};
