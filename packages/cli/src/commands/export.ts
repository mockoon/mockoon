import { OpenApiConverter } from '@mockoon/commons';
import { Command, Flags } from '@oclif/core';
import { promises as fs } from 'fs';
import { parseDataFile } from '../libs/data';

export default class Export extends Command {
  public static description =
    'Export a mock API to an OpenAPI v3 specification file (JSON)';

  public static examples = [
    '$ mockoon-cli export --input ~/data.json --output ./output.json',
    '$ mockoon-cli export --input ~/data.json --output ./output.json --format JSON --prettify'
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
    format: Flags.string({
      char: 'f',
      description: 'Output format, "json" or "yaml" (default: "json")',
      required: false,
      options: ['json', 'yaml'] as const,
      default: 'json'
    }),
    prettify: Flags.boolean({
      char: 'p',
      description: 'Prettify output (JSON only)',
      default: false
    })
  };

  public async run(): Promise<void> {
    const { flags: userFlags } = await this.parse(Export);

    try {
      const parsedEnvironment = await parseDataFile(userFlags.input);

      const openApiConverter = new OpenApiConverter();
      const data: string = await openApiConverter.convertToOpenAPIV3(
        parsedEnvironment.environment,
        userFlags.format as 'json' | 'yaml',
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
