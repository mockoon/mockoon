import {
  readFileSync as jsonReadFileSync,
  writeFile,
  writeFileSync as jsonWriteFileSync
} from 'jsonfile';
import * as pm2 from 'pm2';
import { Proc, ProcessDescription } from 'pm2';
import { promisify } from 'util';
import { Config } from '../config';
import { filterProcesses } from './utils';

export type ConfigProcess = {
  name?: string;
  pid: number;
  port: number;
  hostname: string;
  endpointPrefix: string;
};

/**
 * Manage the file containing the running processes list
 */
export const ProcessListManager = {
  addProcess: async (configProcess: ConfigProcess): Promise<void> => {
    const configData: ConfigProcess[] = ProcessListManager.getProcesses();

    if (
      !configData.find(
        (conf) =>
          conf.name === configProcess.name && conf.port === configProcess.port
      )
    ) {
      configData.push(configProcess);

      return await writeFile(Config.processesFilePath, configData, {
        spaces: 2
      });
    }
  },
  getProcesses: (): ConfigProcess[] => {
    let configProcesses: ConfigProcess[] = [];

    try {
      configProcesses = jsonReadFileSync(Config.processesFilePath);
    } catch (error) {
      jsonWriteFileSync(Config.processesFilePath, configProcesses);
    }

    return configProcesses;
  },
  updateProcesses: async (
    processes: pm2.ProcessDescription[]
  ): Promise<void> => {
    const configProcesses: ConfigProcess[] =
      processes.length > 0 ? ProcessListManager.getProcesses() : [];
    processes.forEach((process) => {
      configProcesses.filter((conf) => conf.name === process.name);
    });

    return await writeFile(Config.processesFilePath, configProcesses, {
      spaces: 2
    });
  },
  deleteProcess: (name?: string): void => {
    let configProcesses: ConfigProcess[] = ProcessListManager.getProcesses();

    configProcesses = configProcesses.filter((data) => data.name !== name);

    jsonWriteFileSync(Config.processesFilePath, configProcesses, { spaces: 2 });
  }
};

/**
 * Promisify PM2 methods
 */
export const ProcessManager = {
  list: async (): Promise<ProcessDescription[]> => {
    const processes = await promisify(pm2.list.bind(pm2))();
    const filteredProcesses = filterProcesses(processes);

    await ProcessListManager.updateProcesses(filteredProcesses);

    return filteredProcesses;
  },
  start: <(options: pm2.StartOptions) => Promise<Proc>>(
    promisify(pm2.start.bind(pm2))
  ),
  delete: promisify(pm2.delete.bind(pm2)),
  disconnect: pm2.disconnect.bind(pm2)
};
