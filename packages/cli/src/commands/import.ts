import { Command, flags } from '@oclif/command';
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
    data: flags.string({
      char: 'd',
      description: 'Path or URL to your data file',
      required: true
    }),
    output: flags.string({
      char: 'o',
      description:
        'Generated Mockoon path and name (e.g. `./environment.json`)',
      required: true
    }),
    port: flags.integer({
      char: 'p',
      description: 'Environment port',
      default: 8080
    }),
    prettify: flags.boolean({
      description: 'Prettify output',
      default: false
    })
  };

  public async run(): Promise<void> {
    const { flags: userFlags } = this.parse(Import);

    try {
      const parsedEnvironments = await parseDataFiles([userFlags.data]);

      if (parsedEnvironments.environments.length !== 1) {
        this.error(CLIMessages.ONLY_ONE_ENVIRONMENT_ALLOWED);
      }

      const environment = parsedEnvironments.environments[0];
      environment.port = userFlags.port;

      const data = JSON.stringify(
        parsedEnvironments.environments[0],
        null,
        userFlags.prettify ? 2 : 0
      );

      await fs.writeFile(userFlags.output, data, 'utf-8');
    } catch (error: any) {
      this.error(error.message);
    }
  }
}
