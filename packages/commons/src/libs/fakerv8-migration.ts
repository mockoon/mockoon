import { FAKER_V7_TO_V8_MAPPING } from '../constants/faker-migration-map.constants';

export const fakerV8Migration = (data: any) => {
  if (data) {
    for (const [key, value] of Object.entries(FAKER_V7_TO_V8_MAPPING)) {
      const oldMethod = new RegExp(
        // |---------1----------|      |---2--||-----3------|
        `(\{{2,3}[^{]*faker[^}]*)${key}([^})]*)([^}]*\}{2,3})`,
        'g'
      );
      /* Above regex matches all faker methods in below formats
          1. {{faker 'person.firstName'}}
          2. {{faker 'int' min=10 max=100}}
          3. {{faker 'person.prefix' sex='male'}}
          4. {{{setVar 'x' (faker 'number.float' precision=0.01)}}}
          Note: both single quotes & double quotes supported
          */
      const newMethod =
        value instanceof Array
          ? `\$1${value[0]}\$2 ${value.slice(1).join(' ')}$3`
          : value === ''
          ? ''
          : `\$1${value}\$2$3`;
      data = data.replace(oldMethod, newMethod);
    }
  }

  return data;
};
