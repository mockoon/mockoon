import { flags } from '@oclif/command';

export const commonFlags = {
  help: flags.help({ char: 'h' })
};

export const startFlags = {
  data: flags.string({
    char: 'd',
    description: 'Path(s) or URL(s) to your Mockoon data file(s)',
    required: true,
    multiple: true
  }),
  port: flags.integer({
    char: 'p',
    description: 'Override environment(s) port(s)',
    multiple: true,
    default: []
  }),
  'log-transaction': flags.boolean({
    char: 't',
    description: 'Log the full HTTP transaction (request and response)',
    default: false
  }),
  repair: flags.boolean({
    char: 'r',
    description:
      'If the data file seems too old, or an invalid Mockoon file, migrate/repair without prompting',
    default: false
  })
};
