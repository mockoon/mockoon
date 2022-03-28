import { Environment, Environments } from '@mockoon/commons';
import { Command, flags } from '@oclif/command';
import { readFile as readJSONFile } from 'jsonfile';
import { join, resolve } from 'path';
import { Proc, ProcessDescription } from 'pm2';
import { format } from 'util';
import { Config } from '../config';
import { commonFlags, startFlags } from '../constants/command.constants';
import { Messages } from '../constants/messages.constants';
import { parseDataFiles, prepareEnvironment } from '../libs/data';
import { ProcessListManager, ProcessManager } from '../libs/process-manager';
import { createServer } from '../libs/server';
import { getDirname, portInUse, portIsValid } from '../libs/utils';

interface EnvironmentInfo {
  name: string;
  protocol: string;
  hostname: string;
  port: number;
  endpointPrefix: string;
  dataFile: string;
  initialDataDir?: string | null;
  logTransaction?: boolean;
}

type StartFlags = {
  pname: string[];
  hostname: string[];
  'daemon-off': boolean;
  container: boolean;
  data: string[];
  port: number[];
  'log-transaction': boolean;
  repair: boolean;
  help: void;
};

export default class Start extends Command {
  public static description = 'Start one or more mock API';

  public static examples = [
    '$ mockoon-cli start --data ~/data.json',
    '$ mockoon-cli start --data ~/data1.json ~/data2.json --port 3000 3001 --pname mock1 mock2',
    '$ mockoon-cli start --data https://file-server/data.json',
    '$ mockoon-cli start --data ~/data.json --pname "proc1"',
    '$ mockoon-cli start --data ~/data.json --daemon-off',
    '$ mockoon-cli start --data ~/data.json --log-transaction'
  ];

  public static flags = {
    ...commonFlags,
    ...startFlags,
    pname: flags.string({
      char: 'N',
      description: 'Override the process(es) name(s)',
      multiple: true,
      default: []
    }),
    hostname: flags.string({
      char: 'l',
      description: 'Listening hostname(s)',
      multiple: true,
      default: []
    }),
    'daemon-off': flags.boolean({
      char: 'D',
      description:
        'Keep the CLI in the foreground and do not manage the process with PM2',
      default: false
    }),
    /**
     * /!\ Undocumented flag.
     * Mostly for internal use when `start `command is called during
     * a Docker image build.
     *
     * When using the `dockerize` command, file loading, validity checks,
     * migrations, etc. are all performed, and the single environment is
     * extracted in a separated file next to the generated Dockerfile.
     * It's easier to directly provide this file to the `start` command run
     * from the Dockerfile when building the Docker image rather than
     * having the image build failing due to a failure in the `start` command.
     */
    container: flags.boolean({
      char: 'c',
      hidden: true
    })
  };

  public async run(): Promise<void> {
    const { flags: userFlags } = this.parse(Start);

    let environmentsInfo: EnvironmentInfo[] = [];

    try {
      // We are in a container, env file is ready and relative to the Dockerfile
      if (userFlags.container) {
        environmentsInfo = await this.getEnvInfoListFromContainerFlag(
          userFlags
        );
      } else {
        const parsedEnvironments = await parseDataFiles(userFlags.data);
        userFlags.data = parsedEnvironments.filePaths;

        environmentsInfo = await this.getEnvironmentsInfo(
          userFlags,
          parsedEnvironments.environments
        );
      }

      for (const environmentInfo of environmentsInfo) {
        await this.validatePort(environmentInfo.port, environmentInfo.hostname);
        await this.validateName(environmentInfo.name);

        if (userFlags['daemon-off']) {
          this.startForegroundProcess(environmentInfo);
        } else {
          await this.startManagedProcess(environmentInfo);
        }
      }
    } catch (error: any) {
      this.error(error.message);
    } finally {
      ProcessManager.disconnect();
    }
  }

  private async addProcessToProcessListManager(
    environmentInfo: EnvironmentInfo,
    process: Proc
  ): Promise<void> {
    await ProcessListManager.addProcess({
      name: environmentInfo.name,
      port: environmentInfo.port,
      hostname: environmentInfo.hostname,
      endpointPrefix: environmentInfo.endpointPrefix,
      pid: process[0].pm2_env.pm_id
    });
  }

  private logStartedProcess(environmentInfo: EnvironmentInfo, process: Proc) {
    const hostname =
      environmentInfo.hostname === '0.0.0.0'
        ? 'localhost'
        : environmentInfo.hostname;

    this.log(
      Messages.CLI.PROCESS_STARTED,
      environmentInfo.protocol,
      hostname,
      environmentInfo.port,
      process[0].pm2_env.pm_id,
      process[0].pm2_env.name
    );
  }

  /**
   * Start the mock server and run it in the same process in the foreground.
   * We don't use PM2 here to manage the process
   *
   * @param environmentInfo
   * @returns
   */
  private startForegroundProcess(environmentInfo: EnvironmentInfo): void {
    const parameters: Parameters<typeof createServer>[0] = {
      data: environmentInfo.dataFile,
      environmentDir: environmentInfo.initialDataDir
        ? environmentInfo.initialDataDir
        : '',
      logTransaction: environmentInfo.logTransaction,
      fileTransportsOptions: [
        { filename: join(Config.logsPath, `${environmentInfo.name}-out.log`) }
      ]
    };

    createServer(parameters);
  }

  /**
   * Start the mock server and manage the process with PM2
   *
   * @param environmentInfo
   * @returns
   */
  private async startManagedProcess(environmentInfo: EnvironmentInfo) {
    const args = ['--data', environmentInfo.dataFile];

    if (environmentInfo.initialDataDir) {
      args.push('--environmentDir', environmentInfo.initialDataDir);
    }
    if (environmentInfo.logTransaction) {
      args.push('--logTransaction');
    }

    const process = await ProcessManager.start({
      max_restarts: 1,
      wait_ready: true,
      min_uptime: 10000,
      kill_timeout: 2000,
      args,
      error: join(Config.logsPath, `${environmentInfo.name}-error.log`),
      output: join(Config.logsPath, `${environmentInfo.name}-out.log`),
      name: environmentInfo.name,
      script: resolve(__dirname, '../libs/server-start-script.js'),
      exec_mode: 'fork'
    });

    if (process[0].pm2_env.status === 'errored') {
      // if process is errored we want to delete it
      await this.handleProcessError(environmentInfo.name);
    }

    this.logStartedProcess(environmentInfo, process);

    await this.addProcessToProcessListManager(environmentInfo, process);
  }

  private async handleProcessError(name: string) {
    // if process is errored we want to delete it
    await ProcessManager.delete(name);

    this.error(format(Messages.CLI.PROCESS_START_LOG_ERROR, name, name));
  }

  private async getEnvInfoListFromContainerFlag(
    userFlags: StartFlags
  ): Promise<EnvironmentInfo[]> {
    const environmentsInfo: EnvironmentInfo[] = [];

    for (const dataFile of userFlags.data) {
      const environment: Environment = await readJSONFile(dataFile, 'utf-8');

      let protocol = 'http';

      if (environment.tlsOptions.enabled) {
        protocol = 'https';
      }

      environmentsInfo.push({
        protocol,
        dataFile,
        name: environment.name,
        hostname: environment.hostname,
        port: environment.port,
        endpointPrefix: environment.endpointPrefix,
        initialDataDir: null,
        logTransaction: userFlags['log-transaction']
      });
    }

    return environmentsInfo;
  }

  private async getEnvironmentsInfo(
    userFlags: StartFlags,
    environments: Environments
  ): Promise<EnvironmentInfo[]> {
    const environmentsInfo: EnvironmentInfo[] = [];

    for (let envIndex = 0; envIndex < environments.length; envIndex++) {
      try {
        const environmentInfo = await prepareEnvironment({
          environment: environments[envIndex],
          userOptions: {
            hostname: userFlags.hostname[envIndex],
            pname: userFlags.pname[envIndex],
            port: userFlags.port[envIndex]
          },
          repair: userFlags.repair
        });

        environmentsInfo.push({
          ...environmentInfo,
          initialDataDir: getDirname(userFlags.data[envIndex]),
          logTransaction: userFlags['log-transaction']
        });
      } catch (error: any) {
        this.error(error.message);
      }
    }

    return environmentsInfo;
  }

  private async validateName(name: string) {
    const runningProcesses: ProcessDescription[] = await ProcessManager.list();
    const processNamesList = runningProcesses.map((process) => process.name);
    if (processNamesList.includes(name)) {
      this.error(format(Messages.CLI.PROCESS_NAME_USED_ERROR, name));
    }
  }

  private async validatePort(port: number, hostname: string) {
    if (!portIsValid(port)) {
      this.error(format(Messages.CLI.PORT_IS_NOT_VALID, port));
    }
    if (await portInUse(port, hostname)) {
      this.error(format(Messages.CLI.PORT_ALREADY_USED, port));
    }
  }
}
