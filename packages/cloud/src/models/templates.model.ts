export type Template = {
  id: string;
  name: string;
  slug: string;
  content: string;
  type: string;
  source?: string;
  // even if templates are free (>v8.0.0) the pro flag needs to be kept for backward compatibility with older versions
  pro: boolean;
};

export type TemplateListItem = Omit<Template, 'content' | 'type' | 'source'>;

// <8.2.0 there was two more options: 'array' and 'json'. JSON is now the default and array is deducted from the user prompt
export type TemplateGenerateOptions = 'templating'[];
