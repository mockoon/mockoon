import { RandomInt } from '@mockoon/commons';
import { EOL } from 'os';

const repeat = function (...args: any[]) {
  let content = '';
  let count = 0;
  const options = args[args.length - 1];
  const data = { ...options.data };

  if (arguments.length === 3) {
    // If given two numbers then pick a random one between the two
    count = RandomInt(args[0], args[1]);
  } else if (arguments.length === 2) {
    count = args[0];
  } else {
    throw new Error('The repeat helper requires a numeric param');
  }

  for (let i = 0; i < count; i++) {
    // You can access these in your template using @index, @total, @first, @last
    data.index = i;
    data.total = count;
    data.first = i === 0;
    data.last = i === count - 1;

    // By using 'this' as the context the repeat block will inherit the current scope
    // @ts-expect-error todo: check how it works with this
    content = content + options.fn(this, { data });

    if (options.hash.comma !== false) {
      // Trim any whitespace left by handlebars and add a comma if it doesn't already exist,
      // also trim any trailing commas that might be at the end of the loop
      content = content.trimRight();
      if (i < count - 1 && !content.endsWith(',')) {
        content += ',';
      } else if (i === count - 1 && content.endsWith(',')) {
        content = content.slice(0, -1);
      }
      content += EOL;
    }
  }

  return content;
};

export default repeat;
