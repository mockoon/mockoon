export type Template = {
  id: string;
  name: string;
  slug: string;
  content: string;
  type: string;
  source?: string;
  pro: boolean;
};

export type TemplateListItem = Omit<Template, 'content' | 'type' | 'source'>;

export type TemplateGenerateOptions = {
  templating: boolean;
  json: boolean;
  list: boolean;
};
