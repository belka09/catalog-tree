export interface TreeNode {
  id: string;
  children: TreeNode[];
  isExpanded?: boolean;
  isFolder?: boolean; // Add property to distinguish between folder and file
}

export interface DropInfo {
  targetId: string;
  action?: string;
}

export var demoData: TreeNode[] = [
  {
    id: 'item 1',
    children: [],
    isFolder: false,
  },
  {
    id: 'item 2',
    children: [
      {
        id: 'item 2.1',
        children: [],
        isFolder: false,
      },
      {
        id: 'item 2.2',
        children: [],
        isFolder: false,
      },
      {
        id: 'item 2.3',
        children: [],
        isFolder: false,
      },
    ],
    isFolder: true,
  },
  {
    id: 'item 3',
    children: [],
    isFolder: false,
  },
];
