// convert base64 to a string
import { FromBase64 } from '../../utils';
import { HelperOptions, SafeString } from 'handlebars';

const base64Decode = function (...args: any[]) {
  const hbsOptions: HelperOptions & hbs.AST.Node = args[args.length - 1];

  let content: string;

  if (args.length === 1) {
    content = hbsOptions.fn(hbsOptions);
  } else {
    content = args[0];
  }

  // convert content toString in case we pass a SafeString from another helper
  return new SafeString(FromBase64(content.toString()));
};

export default base64Decode;
