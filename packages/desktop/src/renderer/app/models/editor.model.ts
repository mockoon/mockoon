export type EditorModes = 'json' | 'html' | 'xml' | 'css' | 'text';

export type EditorModalPayload = {
  content: string;
  title: string;
  editorConfig: {
    mode: EditorModes;
  } & any;
};
