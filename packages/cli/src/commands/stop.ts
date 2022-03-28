import { Command } from '@oclif/command';
import * as inquirer from 'inquirer';
import { ProcessDescription } from 'pm2';
import { commonFlags } from '../constants/command.constants';
import { Messages } from '../constants/messages.constants';
import { cleanDataFiles } from '../libs/data';
import { ProcessListManager, ProcessManager } from '../libs/process-manager';
import { logProcesses } from '../libs/utils';

export default class Stop extends Command {
  public static description = 'Stop a mock API';
  public static examples = [
    '$ mockoon-cli stop',
    '$ mockoon-cli stop 0',
    '$ mockoon-cli stop "name"',
    '$ mockoon-cli stop "all"'
  ];

  public static flags = {
    ...commonFlags
  };

  public static args = [
    {
      name: 'id',
      description: 'Running API pid or name',
      required: false
    }
  ];

  public async run(): Promise<void> {
    const { args } = this.parse(Stop);
    let relistProcesses = false;
    let processesToStop: (string | number)[] = [];

    const processes: ProcessDescription[] = await ProcessManager.list();

    if (processes.length === 0) {
      this.log(Messages.CLI.NO_RUNNING_PROCESS);

      ProcessManager.disconnect();

      return;
    }

    // prompt for process name or id
    if (args.id === undefined) {
      const response: { process: string } = await inquirer.prompt([
        {
          name: 'process',
          message: 'Please select a process',
          type: 'list',
          choices: processes.map((process) => ({
            name: process.name || process.pid
          }))
        }
      ]);

      processesToStop.push(response.process);
    } else if (args.id === 'all') {
      // list all mockoon's processes to stop
      processesToStop = processes.reduce<(string | number)[]>(
        (processes1, process) => {
          const nameOrId = process.name || process.pm_id;

          if (nameOrId !== undefined) {
            processes1.push(nameOrId);
          }

          return processes1;
        },
        []
      );
    } else {
      processesToStop.push(args.id);
    }

    for (const processToStop of processesToStop) {
      try {
        // typing is wrong, delete() returns an array
        const stoppedProcesses: ProcessDescription[] =
          (await ProcessManager.delete(processToStop)) as ProcessDescription[];
        // verify that something has been stopped
        stoppedProcesses.forEach((stoppedProcess) => {
          if (stoppedProcess !== undefined) {
            this.log(
              Messages.CLI.PROCESS_STOPPED,
              stoppedProcess.pm_id,
              stoppedProcess.name
            );

            ProcessListManager.deleteProcess(stoppedProcess.name);
          }
        });
      } catch (error: any) {
        if (error.message === 'process name not found' && args.id === 'all') {
          // if 'all' was specified and no process was stopped, do not list and immediately exit
          this.log(Messages.CLI.NO_RUNNING_PROCESS);
        } else {
          this.error(error.message, { exit: false });
          relistProcesses = true;
        }
      }
    }

    try {
      const runningProcesses: ProcessDescription[] =
        await ProcessManager.list();

      if (relistProcesses) {
        if (runningProcesses.length) {
          this.log(Messages.CLI.RUNNING_PROCESSES);
          logProcesses(runningProcesses);
        } else {
          this.log(Messages.CLI.NO_RUNNING_PROCESS);
        }
      }

      // always clean data files after a stop
      await cleanDataFiles(runningProcesses);
    } catch (error: any) {
      this.error(error.message, { exit: false });
    }

    ProcessManager.disconnect();
  }
}
