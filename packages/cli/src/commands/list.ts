import { Args, Command } from '@oclif/core';
import { ProcessDescription } from 'pm2';
import { format } from 'util';
import { CLIMessages } from '../constants/cli-messages.constants';
import { commonFlags } from '../constants/command.constants';
import { ProcessManager } from '../libs/process-manager';
import { logProcesses } from '../libs/utils';

export default class List extends Command {
  public static description = 'List running mock APIs';

  public static examples = [
    '$ mockoon-cli list',
    '$ mockoon-cli info',
    '$ mockoon-cli list 0',
    '$ mockoon-cli list "Mock_environment"'
  ];
  public static flags = {
    ...commonFlags
  };

  public static args = {
    id: Args.string({
      description: 'Running API pid or name',
      required: false
    })
  };
  public static aliases = ['info'];

  public async run(): Promise<void> {
    const { args } = await this.parse(List);

    try {
      let processes: ProcessDescription[] = await ProcessManager.list();

      if (args.id !== undefined) {
        processes = processes.filter(
          (process) =>
            process.pm_id === parseInt(args.id as string, 10) ||
            process.name === args.id
        );
      }

      if (processes.length) {
        logProcesses(processes);
      } else {
        this.log(
          args.id
            ? format(CLIMessages.NO_RUNNING_PROCESS_FOUND, args.id)
            : CLIMessages.NO_RUNNING_PROCESS
        );
      }
    } catch (error: any) {
      this.error(error.message);
    } finally {
      ProcessManager.disconnect();
    }
  }
}
