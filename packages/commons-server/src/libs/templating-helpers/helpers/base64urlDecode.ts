// convert base64url to a string
import { HelperOptions, SafeString } from 'handlebars';
import { FromBase64URL } from '../../utils';

const base64urlDecode = function (...args: any[]): any {
  const hbsOptions: HelperOptions & hbs.AST.Node = args[args.length - 1];

  let content: string;

  if (args.length === 1) {
    content = hbsOptions.fn(hbsOptions);
  } else {
    content = args[0];
  }

  // convert content toString in case we pass a SafeString from another helper
  return new SafeString(FromBase64URL(content.toString()));
};

export default base64urlDecode;
