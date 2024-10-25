import { Command, Flags } from '@oclif/core';
import { promises as fs } from 'fs';
import { mkdirp } from 'mkdirp';
import { render as mustacheRender } from 'mustache';
import { ParsedPath, parse as pathParse, resolve as pathResolve } from 'path';
import { Config } from '../config';
import { CLIMessages } from '../constants/cli-messages.constants';
import { commonFlags } from '../constants/command.constants';
import { DOCKER_TEMPLATE } from '../constants/docker.constants';

export default class Dockerize extends Command {
  public static description =
    'Copy (or download) all the provided data files locally and create a Dockerfile to build a self-contained image of one or more mock API';

  public static examples = [
    '$ mockoon-cli dockerize --data ~/data.json --output ./folder/Dockerfile',
    '$ mockoon-cli dockerize --data ~/data1.json ~/data2.json --output ./folder/Dockerfile',
    '$ mockoon-cli dockerize --data https://file-server/data.json --output ./folder/Dockerfile'
  ];

  public static flags = {
    ...commonFlags,
    port: Flags.integer({
      char: 'p',
      description:
        'Ports to expose in the Docker container. It should match the number of environment data files you provide with the --data flag.',
      multiple: true,
      required: true
    }),
    output: Flags.string({
      char: 'o',
      description:
        'Generated Dockerfile path and name (e.g. `./folder/Dockerfile`)',
      required: true
    })
  };

  public async run(): Promise<void> {
    const { flags: userFlags } = await this.parse(Dockerize);
    const resolvedDockerfilePath = pathResolve(userFlags.output);
    const dockerfilePath: ParsedPath = pathParse(resolvedDockerfilePath);

    await mkdirp(dockerfilePath.dir);

    if (userFlags.data.length !== userFlags.port.length) {
      this.error(CLIMessages.DOCKERIZE_PORT_DATA_MISMATCH);
    }

    try {
      const filePaths: string[] = [];
      let entrypoint: string[] = [
        'mockoon-cli',
        'start',
        '--disable-log-to-file',
        '--data'
      ];

      // copy or download the data files next to the generated Dockerfile
      for (const dataPath of userFlags.data) {
        const parsedDataPath = pathParse(dataPath);
        const fileName =
          parsedDataPath.ext !== '.json'
            ? `${parsedDataPath.name}.json`
            : parsedDataPath.base;

        if (dataPath.startsWith('http')) {
          const resdata = await (await fetch(dataPath)).text();

          await fs.writeFile(
            pathResolve(dockerfilePath.dir, fileName),
            resdata
          );
        } else {
          await fs.copyFile(
            pathResolve(dataPath),
            pathResolve(dockerfilePath.dir, fileName)
          );
        }
        filePaths.push(`./${fileName}`);
        entrypoint.push(`./${fileName}`);
      }

      entrypoint = [...entrypoint, '--port', ...userFlags.port.map(String)];

      if (userFlags['log-transaction']) {
        entrypoint.push('--log-transaction');
      }

      const dockerFile = mustacheRender(DOCKER_TEMPLATE, {
        ports: userFlags.port.join(' '),
        filePaths,
        version: Config.version,
        entrypoint: JSON.stringify(entrypoint)
      });

      await fs.writeFile(resolvedDockerfilePath, dockerFile);

      this.log(CLIMessages.DOCKERIZE_SUCCESS, resolvedDockerfilePath);
      this.log(
        CLIMessages.DOCKERIZE_BUILD_COMMAND,
        dockerfilePath.dir,
        'mockoon-image',
        userFlags.port.map((port) => `-p ${port}:${port}`).join(' '),
        'mockoon-image'
      );
    } catch (error) {
      if (error instanceof Error) {
        this.error(error.message);
      }
    }
  }
}
