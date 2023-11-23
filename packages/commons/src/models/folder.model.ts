export type FolderChild = { type: 'route' | 'folder'; uuid: string };

export type Folder = {
  uuid: string;
  name: string;
  children: FolderChild[];
};
