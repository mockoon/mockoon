import { MarkedOptions, MarkedRenderer } from 'ngx-markdown';

export function MarkedOptionsFactory(): MarkedOptions {
  const renderer = new MarkedRenderer();

  // override markdown links to only show text
  renderer.link = (_href: string, _title: string, text: string) => {
    return text;
  };

  return {
    renderer: renderer,
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false,
  };
}
