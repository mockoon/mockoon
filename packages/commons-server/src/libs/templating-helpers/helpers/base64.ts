import { HelperOptions, SafeString } from 'handlebars';
import { ToBase64 } from '../../utils';

// converts the input to a base64 string
const base64 = function (...args: any[]): SafeString {
  const hbsOptions: HelperOptions & hbs.AST.Node = args[args.length - 1];

  let content: string;

  if (args.length === 1) {
    content = hbsOptions.fn(hbsOptions);
  } else {
    content = args[0];
  }

  // convert content toString in case we pass a SafeString from another helper
  return new SafeString(ToBase64(content.toString()));
};

export default base64;
