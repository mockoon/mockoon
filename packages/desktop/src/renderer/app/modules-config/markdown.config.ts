import { MarkedOptions, MarkedRenderer } from 'ngx-markdown';
import { Config } from 'src/shared/config';

export const MarkedOptionsFactory = (): MarkedOptions => {
  const renderer = new MarkedRenderer();

  renderer.table = (header: string, body: string) => {
    header = header.replace('NOSTYLE', '');

    return `<table class="table table-borderless"><tbody>${body}</tbody></table>`;
  };
  // Open all links in an external browser
  renderer.link = (href: string, title: string, text: string) => {
    if (!href.startsWith('http')) {
      href = `${Config.websiteURL}${href}`;
    }

    return `<a href="${href}" target="_blank">${text}</a>`;
  };

  // Make images responsive
  renderer.image = (src: string, title: string, text: string) => {
    src = src.replace(/^\/images\//g, `${Config.websiteURL}images/`);

    return `<img src="${src}" class="img-fluid mx-auto d-block" alt="${text}">`;
  };

  renderer.hr = () => '<hr class="my-5">';

  renderer.heading = (text: string, level: number) => {
    let hasVertBar = false;

    if (text.includes('|')) {
      hasVertBar = true;
      text = text.replace('|', '');
    }

    return `<h${level} class="mt-5 mb-4">${
      hasVertBar ? '<span class="text-primary pr-2">|</span>' : ''
    }${text}</h${level}>`;
  };

  return {
    renderer,
    gfm: true,
    breaks: false,
    pedantic: false,
    smartLists: true,
    smartypants: false
  };
};
