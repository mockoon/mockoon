import { EditorModes } from 'src/renderer/app/models/editor.model';

export const ArrayContainsObjectKey = (
  obj: { [key: string]: any },
  arr: string[]
) => {
  if (obj && arr) {
    return !!Object.keys(obj).find((key) => arr.includes(key));
  }

  return false;
};

export const RemoveLeadingSlash = (str: string) => str.replace(/^\//g, '');

/**
 * Retrieve the editor mode (Ace editor) from a content type
 *
 * @param contentType
 */
export const GetEditorModeFromContentType = (
  contentType: string
): EditorModes => {
  if (contentType.includes('application/json')) {
    return 'json';
  } else if (
    contentType.includes('text/html') ||
    contentType.includes('application/xhtml+xml')
  ) {
    return 'html';
  } else if (contentType.includes('application/xml')) {
    return 'xml';
  } else if (contentType.includes('text/css')) {
    return 'css';
  } else {
    return 'text';
  }
};

export const ArrayMoveItem = (
  arr: any[],
  sourceIndex: number,
  targetIndex: number
) => {
  const newArray = arr.slice();
  newArray.splice(targetIndex, 0, newArray.splice(sourceIndex, 1)[0]);

  return newArray;
};
