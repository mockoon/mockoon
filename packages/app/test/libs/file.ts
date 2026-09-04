import { Environment, Environments } from '@mockoon/commons';
import { objectGetPath } from '@mockoon/commons-server';
import { promises as fs } from 'fs';

class File {
  public async editEnvironment(
    filePath: string,
    properties: Partial<Environment>
  ) {
    let environment = JSON.parse((await fs.readFile(filePath)).toString());
    environment = { ...environment, ...properties };
    await fs.writeFile(filePath, JSON.stringify(environment));
  }

  public async getObjectPropertyInFile(filePath: string, objectPath: string) {
    const file = await fs.readFile(filePath);
    const content: Environments = JSON.parse(file.toString());

    return objectGetPath(content, objectPath);
  }

  public async getObjectPropertiesInFile(
    filePath: string,
    objectPaths: string[]
  ) {
    const file = await fs.readFile(filePath);
    const content: Environments = JSON.parse(file.toString());

    return objectPaths.map((op) => objectGetPath(content, op));
  }

  public async verifyObjectPropertyInFile(
    filePath: string,
    objectPaths: string | string[] | string[][],
    values: any | any[],
    exists = false
  ) {
    const file = await fs.readFile(filePath);
    const content = JSON.parse(file.toString());

    this.verifyObjectProperty(content, objectPaths, values, exists);
  }

  public verifyObjectProperty(
    object: any,
    objectPaths: string | string[] | string[][],
    values: any | any[],
    exists = false
  ) {
    objectPaths = Array.isArray(objectPaths) ? objectPaths : [objectPaths];
    values = Array.isArray(values) ? values : [values];

    for (let index = 0; index < objectPaths.length; index++) {
      if (exists) {
        expect(objectGetPath(object, objectPaths[index])).toExist();
      } else {
        expect(objectGetPath(object, objectPaths[index])).toEqual(
          values[index]
        );
      }
    }
  }
}

export default new File();
