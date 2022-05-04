import faker from '@faker-js/faker';
import { HelperOptions } from 'handlebars';
import { IsEmpty } from '../utils';

export const FakerWrapper = {
  faker: function (...args: any[]) {
    const hbsOptions: HelperOptions & hbs.AST.Node = args[args.length - 1];

    let fakerName: string;

    if (args.length === 1) {
      fakerName = '';
    } else {
      fakerName = args[0];
    }

    const [fakerPrimaryMethod, fakerSecondaryMethod] = fakerName.split('.');
    let errorMessage = `${fakerName} is not a valid Faker method`;
    // check faker helper name pattern
    if (
      !fakerName ||
      !fakerName.match(/^[a-z]+\.[a-z]+$/i) ||
      !fakerPrimaryMethod ||
      !fakerSecondaryMethod ||
      !faker[fakerPrimaryMethod] ||
      !faker[fakerPrimaryMethod][fakerSecondaryMethod]
    ) {
      if (!fakerName) {
        errorMessage = 'Faker method name is missing';
      }

      throw new Error(
        `${errorMessage} (valid: "address.zipCode", "date.past", etc) line ${
          hbsOptions.loc &&
          hbsOptions.loc &&
          hbsOptions.loc.start &&
          hbsOptions.loc.start.line
        }`
      );
    }

    const fakerFunction = faker[fakerPrimaryMethod][fakerSecondaryMethod];
    const fakerArgs = args.slice(1, args.length - 1);

    // push hbs named parameters (https://handlebarsjs.com/guide/block-helpers.html#hash-arguments) to Faker
    if (!IsEmpty(hbsOptions.hash)) {
      fakerArgs.push(hbsOptions.hash);
    }

    let fakedContent = fakerFunction(...fakerArgs);

    // do not stringify Date coming from Faker.js
    if (
      (Array.isArray(fakedContent) || typeof fakedContent === 'object') &&
      !(fakedContent instanceof Date)
    ) {
      fakedContent = JSON.stringify(fakedContent);
    }

    return fakedContent;
  }
};
