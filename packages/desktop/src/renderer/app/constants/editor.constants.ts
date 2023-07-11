import { INDENT_SIZE } from '@mockoon/commons';

export const defaultEditorOptions = {
  options: {
    fontSize: '1rem',
    wrap: 'free',
    showPrintMargin: false,
    tooltipFollowsMouse: false,
    useWorker: false,
    tabSize: INDENT_SIZE,
    enableBasicAutocompletion: [
      {
        getCompletions: (editor, session, pos, prefix, callback) => {
          // note, won't fire if caret is at a word that does not have these letters
          callback(null, []);
        }
      }
    ]
  },
  mode: 'json',
  theme: 'editor-theme'
};
