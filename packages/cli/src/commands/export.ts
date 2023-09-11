import { OpenAPIConverter } from '@mockoon/commons-server';
import { Command, Flags } from '@oclif/core';
import { promises as fs } from 'fs';
import { parseDataFiles } from '../libs/data';

export default class Export extends Command {
  public static description = 'Export a mock API';

  public static examples = [
    '$ mockoon-cli export --data ~/data.json --output ./output.json',
    '$ mockoon-cli export --data ~/data.json --output ./output.json --type open-api-v3'
  ];

  public static flags = {
    data: Flags.string({
      char: 'd',
      description: 'Path or URL to your Mockoon data file',
      required: true
    }),
    output: Flags.string({
      char: 'o',
      description: 'Generated OpenApi v3 path and name (e.g. `./output.json`)',
      required: true
    }),
    type: Flags.string({
      char: 't',
      description: 'Export type',
      options: ['open-api-v3'],
      default: 'open-api-v3',
      required: false
    })
  };

  public async run(): Promise<void> {
    const { flags: userFlags } = await this.parse(Export);

    try {
      const parsedEnvironments = await parseDataFiles([userFlags.data]);
      let data: string;

      switch (userFlags.type) {
        default:
          const openApiConverter = new OpenAPIConverter();
          data = await openApiConverter.convertToOpenAPIV3(
            parsedEnvironments[0].environment
          );
      }

      await fs.writeFile(userFlags.output, data, 'utf-8');
    } catch (error: any) {
      this.error(error.message);
    }
  }
}
