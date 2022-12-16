import { Folder } from '@mockoon/commons';

export type FolderProperties = { [T in keyof Folder]?: Folder[T] };
