import { ChildProcess, spawn } from 'node:child_process';

export const delay = (t: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, t));

/**
 * Spawn a CLI command and return the instance and the output (stdout and stderr).
 * Usage:
 *
 * - Launch the CLI command with the arguments provided in the args array.
 * - Test API calls to the mock server.
 * - kill the instance.
 * - Test the output if needed.
 *
 * @param args
 * @returns
 */
export const spawnCli = (
  args: ReadonlyArray<string>
): Promise<{
  instance: ChildProcess;
  output: Promise<{ stdout: string; stderr: string }>;
}> =>
  new Promise((resolve) => {
    const instance = spawn('node', ['./bin/run.js', ...args]);

    const output = new Promise<{ stdout: string; stderr: string }>(
      (outputResolve) => {
        const stderr: string[] = [];
        const stdout: string[] = [];

        instance.stdout.on('data', (data) => {
          stdout.push(data.toString());
        });

        instance.stderr.on('data', (data) => {
          stderr.push(data.toString());
        });

        instance.on('error', (e) => {
          stderr.push(e.toString());
        });

        instance.on('close', () => {
          outputResolve({
            stdout: stdout.join(''),
            stderr: stderr.length ? stderr.join('') : ''
          });
        });
      }
    );

    // resolve the instance as soon as it closes
    instance.stdout.on('close', () => {
      resolve({ instance, output });
    });

    // or resolve the instance as soon as we get stdout data (meaning the server is up)
    instance.stdout.on('data', () => {
      resolve({ instance, output });
    });
  });
