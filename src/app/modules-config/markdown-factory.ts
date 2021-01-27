import { MarkedOptions, MarkedRenderer } from 'ngx-markdown';

export function MarkedOptionsFactory(): MarkedOptions {
  const renderer = new MarkedRenderer();

  // Whitelist links domains
  renderer.link = (href: string, title: string, text: string) => {
    if (href.match(/mockoon\.com|github\.com/i)) {
      return `<a href="openexternal::${href}" target="_blank">${text}</a>`;
    }

    return text;
  };

  return {
    renderer: renderer,
    gfm: true,
    breaks: false,
    pedantic: false,
    smartLists: true,
    smartypants: false
  };
}
