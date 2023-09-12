import { Environment } from '@mockoon/commons';
import { OpenAPIConverter } from '@mockoon/commons-server';
import { Command, Flags } from '@oclif/core';
import { promises as fs } from 'fs';
import { CLIMessages } from '../constants/cli-messages.constants';
import { parseDataFiles, prepareEnvironment } from '../libs/data';

export default class Export extends Command {
  public static description =
    'Export a mock API to an OpenAPI v3 specification file (JSON)';

  public static examples = [
    '$ mockoon-cli export --input ~/data.json --output ./output.json',
    '$ mockoon-cli export --input ~/data.json --output ./output.json --prettify'
  ];

  public static flags = {
    input: Flags.string({
      char: 'i',
      description: 'Path or URL to your Mockoon data file',
      required: true
    }),
    output: Flags.string({
      char: 'o',
      description: 'Generated OpenApi v3 path and name (e.g. `./output.json`)',
      required: true
    }),
    prettify: Flags.boolean({
      char: 'p',
      description: 'Prettify output',
      default: false
    })
  };

  public async run(): Promise<void> {
    const { flags: userFlags } = await this.parse(Export);

    try {
      const parsedEnvironments = await parseDataFiles([userFlags.input]);

      if (parsedEnvironments.length !== 1) {
        this.error(CLIMessages.ONLY_ONE_ENVIRONMENT_ALLOWED);
      }

      const environment: Environment = await prepareEnvironment({
        environment: parsedEnvironments[0].environment,
        userOptions: {}
      });
      const openApiConverter = new OpenAPIConverter();
      const data: string = await openApiConverter.convertToOpenAPIV3(
        environment,
        userFlags.prettify
      );

      await fs.writeFile(userFlags.output, data, 'utf-8');
    } catch (error: any) {
      this.error(error.message);
    }
  }
}
