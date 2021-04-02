export type EditorModes = 'json' | 'html' | 'xml' | 'css' | 'text';
export type EditorModalEvent = {
  content: string;
  title: string;
  mode: EditorModes;
};
export type EditorModalData = {
  content: string;
  title: string;
  editorConfig: any;
};

