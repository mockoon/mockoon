import { MarkedOptions, MarkedRenderer } from 'ngx-markdown';
import { Config } from 'src/renderer/config';

export const MarkedOptionsFactory = (): MarkedOptions => {
  const renderer = new MarkedRenderer();

  // Open all links in an external browser
  renderer.link = function ({ href, tokens }) {
    if (!href.startsWith('http')) {
      href = `${Config.websiteURL}${href}`;
    }

    return `<a href="${href}" target="_blank">${this.parser.parseInline(tokens)}</a>`;
  };

  // Make images responsive
  renderer.image = ({ href, title }) => {
    href = href.replace(/^\/images\//g, `${Config.websiteURL}images/`);

    return `<img src="${href}" class="img-fluid mx-auto d-block" style="filter:drop-shadow(0 0 .75rem rgba(0,0,0,.2));" alt="${title}">`;
  };

  renderer.hr = () => '<hr class="my-5">';

  renderer.heading = function ({ text, depth, tokens }) {
    let hasVertBar = false;

    if (text.includes('|')) {
      hasVertBar = true;
      text = text.replace('|', '');
    }

    return `<h${depth} class="mt-5 mb-4">${
      hasVertBar ? '<span class="text-primary pe-2">|</span>' : ''
    }${this.parser.parseInline(tokens)}</h${depth}>`;
  };

  return {
    renderer,
    gfm: true,
    breaks: false,
    pedantic: false
  };
};
