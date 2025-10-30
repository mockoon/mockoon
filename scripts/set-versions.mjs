import { exec } from 'node:child_process';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { promisify } from 'node:util';

const exec$ = promisify(exec);
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const readPackageJson = async (path) => {
  const data = await readFile(path, 'utf-8');
  return JSON.parse(data);
};

async function main() {
  const answer = await rl.question('Enter the version (e.g., 1.2.3): ');
  const version = answer.trim();

  if (!version) {
    console.error('No version bump provided. Exiting.');
    process.exit(1);
  }

  console.log(
    `Setting all workspaces and dependencies versions to: ${version}`
  );

  try {
    console.log('Updating versions...');

    await exec$(`npm version --git-tag-version=false --workspaces ${version}`, {
      stdio: 'inherit'
    });

    console.log('Removing package-lock.json...');

    await unlink('package-lock.json');

    console.log('Updating dependencies...');
    const rootPackage = await readPackageJson('package.json');

    const workspaces = rootPackage.workspaces || [];

    if (workspaces.length === 0) {
      console.log('No workspaces found in package.json.');
      return;
    }

    for (const workspace of workspaces) {
      console.log(`Updating dependencies in workspace: ${workspace}`);

      const workspacePath = resolve(workspace + '/package.json');
      const workspacePackage = await readPackageJson(workspacePath);

      for (const dependencyName of Object.keys(
        workspacePackage.dependencies || {}
      )) {
        if (dependencyName.includes('@mockoon/')) {
          workspacePackage.dependencies[dependencyName] = version;
        }
      }

      console.log(`Writing updated package.json for workspace: ${workspace}`);

      await writeFile(
        workspacePath,
        JSON.stringify(workspacePackage, null, 2) + '\n',
        'utf-8'
      );
    }

    console.log('Versions updated successfully.');
  } catch (error) {
    console.error('Error updating versions:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
