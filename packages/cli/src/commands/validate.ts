import { EnvironmentSchemaNoFix } from '@mockoon/commons';
import { Command } from '@oclif/core';
import { commonFlags } from '../constants/command.constants';
import { loadFile } from '../libs/data';
import { terminalColors } from '../libs/utils';

export default class Validate extends Command {
  public static description = 'Validate a Mockoon environment JSON file';

  public static examples = [
    '$ mockoon-cli validate --data ~/data1.json ~/data2.json',
    '$ mockoon-cli validate --data https://file-server/data.json'
  ];

  public static flags = {
    ...commonFlags
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Validate);

    try {
      const parsedEnvironments: {
        originalPath: string;
        environment: string;
      }[] = [];
      for (const [_index, filePath] of flags.data.entries()) {
        parsedEnvironments.push({
          originalPath: filePath,
          environment: await loadFile(filePath, true)
        });
      }

      let hasErrors = false;

      for (const envInfo of parsedEnvironments) {
        const { error } = EnvironmentSchemaNoFix.validate(envInfo.environment, {
          abortEarly: false,
          debug: true
        });

        if (error) {
          this.log(
            `${terminalColors.red}⨯${terminalColors.reset} Invalid environment: ${envInfo.originalPath}`
          );

          error.details.forEach((detail) => {
            this.log(
              `  ${terminalColors.red}⨯${terminalColors.reset} ${detail.message}`
            );
          });

          hasErrors = true;
        } else {
          this.log(
            `${terminalColors.green}✓${terminalColors.reset} Valid environment: ${envInfo.originalPath}`
          );
        }
      }

      if (hasErrors) {
        this.error('Environments validation failed', {
          exit: 1
        });
      } else {
        this.log(
          `${terminalColors.green}✓${terminalColors.reset} All environments are valid`
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        this.error(error.message);
      }
    }
  }
}
