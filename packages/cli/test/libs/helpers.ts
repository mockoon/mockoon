import { test } from '@oclif/test';
import { expect } from 'chai';

export const stopProcesses = function (
  flag: string,
  expectedProcesses: string[] = []
): void {
  const params = ['stop'];

  if (flag != null) {
    params.push(flag);
  }

  test
    .stdout()
    .command(params)
    .it(`should stop '${flag}'`, (context) => {
      expectedProcesses.forEach((expectedProcess, index) => {
        expect(context.stdout).to.contain(
          `Process ${index}:${expectedProcess} stopped`
        );
      });
    });
};

export const delay = (t: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, t));
