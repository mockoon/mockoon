import { Environment } from '@mockoon/commons';
import { Command, Flags } from '@oclif/core';
import { promises as fs } from 'fs';
import { CLIMessages } from '../constants/cli-messages.constants';
import { parseDataFiles } from '../libs/data';

export default class Import extends Command {
  public static description =
    'Import a Swagger v2/OpenAPI v3 specification file (YAML or JSON)';

  public static examples = [
    '$ mockoon-cli import --input ~/data.json --output ./output.json',
    '$ mockoon-cli import --input ~/data.json --output ./output.json --prettify'
  ];

  public static flags = {
    input: Flags.string({
      char: 'i',
      description: 'Path or URL to your Swagger v2/OpenAPI v3 file',
      required: true
    }),
    output: Flags.string({
      char: 'o',
      description:
        'Generated Mockoon path and name (e.g. `./environment.json`)',
      required: true
    }),
    prettify: Flags.boolean({
      char: 'p',
      description: 'Prettify output',
      default: false
    })
  };

  public async run(): Promise<void> {
    const { flags: userFlags } = await this.parse(Import);

    try {
      const parsedEnvironments = await parseDataFiles([userFlags.input]);

      if (parsedEnvironments.length !== 1) {
        this.error(CLIMessages.ONLY_ONE_ENVIRONMENT_ALLOWED);
      }

      const environment: Environment = parsedEnvironments[0].environment;
      const data: string = JSON.stringify(
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
