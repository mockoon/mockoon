import { MarkedOptions, MarkedRenderer } from 'ngx-markdown';

export const MarkedOptionsFactory = (): MarkedOptions => {
  const renderer = new MarkedRenderer();

  // Whitelist links domains
  renderer.link = (href: string, title: string, text: string) => {
    if (href.match(/mockoon\.com|github\.com/i)) {
      return `<a href="openexternal::${href}" target="_blank">${text}</a>`;
    }

    return text;
  };

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
