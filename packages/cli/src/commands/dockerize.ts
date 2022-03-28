import { Command, flags } from '@oclif/command';
import { promises as fs } from 'fs';
import * as mkdirp from 'mkdirp';
import { render as mustacheRender } from 'mustache';
import { parse as pathParse, ParsedPath, resolve as pathResolve } from 'path';
import { format } from 'util';
import { Config } from '../config';
import { commonFlags, startFlags } from '../constants/command.constants';
import { DOCKER_TEMPLATE } from '../constants/docker.constants';
import { Messages } from '../constants/messages.constants';
import { parseDataFiles, prepareEnvironment } from '../libs/data';
import { portIsValid } from '../libs/utils';

export default class Dockerize extends Command {
  public static description =
    'Create a Dockerfile to build a self-contained image of one or more mock API';

  public static examples = [
    '$ mockoon-cli dockerize --data ~/data.json --output ./Dockerfile',
    '$ mockoon-cli dockerize --data ~/data1.json ~/data2.json --output ./Dockerfile',
    '$ mockoon-cli dockerize --data https://file-server/data.json --output ./Dockerfile'
  ];

  public static flags = {
    ...commonFlags,
    ...startFlags,
    output: flags.string({
      char: 'o',
      description: 'Generated Dockerfile path and name (e.g. `./Dockerfile`)',
      required: true
    })
  };

  public async run(): Promise<void> {
    const { flags: userFlags } = this.parse(Dockerize);
    const resolvedDockerfilePath = pathResolve(userFlags.output);
    const dockerfilePath: ParsedPath = pathParse(resolvedDockerfilePath);

    const parsedEnvironments = await parseDataFiles(userFlags.data);
    userFlags.data = parsedEnvironments.filePaths;

    const environmentsInfo: { name: any; port: any; dataFile: string }[] = [];

    try {
      for (
        let envIndex = 0;
        envIndex < parsedEnvironments.environments.length;
        envIndex++
      ) {
        const environmentInfo = await prepareEnvironment({
          environment: parsedEnvironments.environments[envIndex],
          userOptions: {
            port: userFlags.port[envIndex]
          },
          dockerfileDir: dockerfilePath.dir,
          repair: userFlags.repair
        });

        environmentsInfo.push(environmentInfo);

        if (!portIsValid(environmentInfo.port)) {
          this.error(
            format(Messages.CLI.PORT_IS_NOT_VALID, environmentInfo.port)
          );
        }
      }

      const dockerFile = mustacheRender(DOCKER_TEMPLATE, {
        ports: environmentsInfo.map((environmentInfo) => environmentInfo.port),
        filePaths: environmentsInfo.map(
          (environmentInfo) => pathParse(environmentInfo.dataFile).base
        ),
        version: Config.version,
        // passing more args to the dockerfile template, only make sense for log transaction yet as other flags are immediately used during the file creation and data preparation
        args: userFlags['log-transaction'] ? ', "--log-transaction"' : ''
      });

      await mkdirp(dockerfilePath.dir);

      await fs.writeFile(resolvedDockerfilePath, dockerFile);

      this.log(Messages.CLI.DOCKERIZE_SUCCESS, resolvedDockerfilePath);
      this.log(
        Messages.CLI.DOCKERIZE_BUILD_COMMAND,
        dockerfilePath.dir,
        environmentsInfo.length > 1
          ? 'mockoon-mocks'
          : environmentsInfo[0].name,
        environmentsInfo.reduce(
          (portsString, environmentInfo) =>
            `${portsString ? portsString + ' ' : portsString}-p ${
              environmentInfo.port
            }:${environmentInfo.port}`,
          ''
        ),
        environmentsInfo.length > 1 ? 'mockoon-mocks' : environmentsInfo[0].name
      );
    } catch (error: any) {
      this.error(error.message);
    }
  }
}
