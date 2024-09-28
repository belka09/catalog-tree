export interface TreeNode {
  id: string;
  children: TreeNode[];
  isExpanded?: boolean;
  isFolder?: boolean;
  icon?: string; // Add icon property to distinguish the icon
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
    icon: 'description',
  },
  {
    id: 'item 2',
    children: [
      {
        id: 'item 2.1',
        children: [],
        isFolder: false,
        icon: 'description',
      },
      {
        id: 'item 2.2',
        children: [],
        isFolder: false,
        icon: 'description',
      },
      {
        id: 'item 2.3',
        children: [],
        isFolder: false,
        icon: 'description',
      },
    ],
    isFolder: true,
    icon: 'folder',
  },
  {
    id: 'item 3',
    children: [],
    isFolder: false,
    icon: 'description',
  },
];
