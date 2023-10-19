import { Environment } from '@mockoon/commons';
import { promises as fs } from 'fs';

export async function getEnvironment(name: string): Promise<Environment> {
  const environmentJson = await fs.readFile(
    `./test/data/environments/${name}-env.json`,
    'utf-8'
  );

  return JSON.parse(environmentJson) as Environment;
}
