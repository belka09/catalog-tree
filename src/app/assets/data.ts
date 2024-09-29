export interface TreeNode {
  id: string;
  children: TreeNode[];
  isExpanded?: boolean;
  isFolder?: boolean;
  icon?: string;
}

export interface DropInfo {
  targetId: string;
  action?: string;
}

export var demoData: TreeNode[] = [
  {
    id: 'File 1',
    children: [],
    isFolder: false,
    icon: 'description',
  },
  {
    id: 'Folder 1',
    children: [
      {
        id: 'File 1.1',
        children: [],
        isFolder: false,
        icon: 'description',
      },
    ],
    isFolder: true,
    icon: 'folder',
  },
  {
    id: 'Folder 2',
    children: [
      {
        id: 'File 2.1',
        children: [],
        isFolder: false,
        icon: 'description',
      },
    ],
    isFolder: true,
    icon: 'folder',
  },
  {
    id: 'File 3',
    children: [],
    isFolder: false,
    icon: 'description',
  },
];
