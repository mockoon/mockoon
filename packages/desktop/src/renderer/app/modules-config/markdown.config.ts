import { MarkedOptions, MarkedRenderer } from 'ngx-markdown';

export const MarkedOptionsFactory = (): MarkedOptions => {
  const renderer = new MarkedRenderer();

  // Open all links in an external browser
  renderer.link = (href: string, title: string, text: string) =>
    `<a href="openexternal::${href}" target="_blank">${text}</a>`;

  // Make images responsive
  renderer.image = (href: string, title: string, text: string) =>
    `<img src="${href}" class="img-fluid mx-auto d-block" alt="${text}">`;

  return {
    renderer,
    gfm: true,
    breaks: false,
    pedantic: false,
    smartLists: true,
    smartypants: false
  };
};
