import { MarkedOptions, MarkedRenderer } from 'ngx-markdown';
import { Config } from 'src/shared/config';

export const MarkedOptionsFactory = (): MarkedOptions => {
  const renderer = new MarkedRenderer();

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

  return {
    renderer,
    gfm: true,
    breaks: false,
    pedantic: false,
    smartLists: true,
    smartypants: false
  };
};
