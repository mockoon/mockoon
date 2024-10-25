import { OpenAPIConverter } from '@mockoon/commons-server';
import { Command, Flags } from '@oclif/core';
import { promises as fs } from 'fs';
import { parseDataFiles } from '../libs/data';

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

      const openApiConverter = new OpenAPIConverter();
      const data: string = await openApiConverter.convertToOpenAPIV3(
        parsedEnvironments[0].environment,
        userFlags.prettify
      );

      await fs.writeFile(userFlags.output, data, 'utf-8');
    } catch (error) {
      if (error instanceof Error) {
        return this.error(error.message);
      }
    }
  }
}
