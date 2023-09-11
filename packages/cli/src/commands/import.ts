import { Command, Flags } from '@oclif/core';
import { promises as fs } from 'fs';
import { CLIMessages } from '../constants/cli-messages.constants';
import { parseDataFiles } from '../libs/data';

export default class Import extends Command {
  public static description = 'Import a mock API';

  public static examples = [
    '$ mockoon-cli import --data ~/data.json --output ./output.json',
    '$ mockoon-cli import --data ~/data.json --output ./output.json --type open-api-v3'
  ];

  public static flags = {
    data: Flags.string({
      char: 'd',
      description: 'Path or URL to your data file',
      required: true
    }),
    output: Flags.string({
      char: 'o',
      description:
        'Generated Mockoon path and name (e.g. `./environment.json`)',
      required: true
    }),
    port: Flags.integer({
      char: 'p',
      description: 'Environment port',
      default: 8080
    }),
    prettify: Flags.boolean({
      description: 'Prettify output',
      default: false
    })
  };

  public async run(): Promise<void> {
    const { flags: userFlags } = await this.parse(Import);

    try {
      const parsedEnvironments = await parseDataFiles([userFlags.data]);

      if (parsedEnvironments.length !== 1) {
        this.error(CLIMessages.ONLY_ONE_ENVIRONMENT_ALLOWED);
      }

      const environment = parsedEnvironments[0].environment;
      environment.port = userFlags.port;

      const data = JSON.stringify(
        environment,
        null,
        userFlags.prettify ? 2 : 0
      );

      await fs.writeFile(userFlags.output, data, 'utf-8');
    } catch (error: any) {
      this.error(error.message);
    }
  }
}
