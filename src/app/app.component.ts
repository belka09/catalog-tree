import { MatFormField, MatLabel } from '@angular/material/form-field';
import { FlatTreeControl } from '@angular/cdk/tree';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
  MatTreeModule,
} from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms'; // Import FormsModule

interface FoodNode {
  name: string;
  icon?: string; // Added icon property
  children?: FoodNode[];
}

const TREE_DATA: FoodNode[] = [
  {
    name: 'Folder 1',
    icon: 'folder', // Default icon
    children: [
      { name: 'Test', icon: 'insert_drive_file' },
      { name: 'Test 2', icon: 'insert_drive_file' },
    ],
  },
  {
    name: 'Folder 2',
    icon: 'folder', // Default icon
    children: [
      {
        name: 'Sub-folder 1',
        icon: 'folder', // Default icon
        children: [
          { name: 'Test3', icon: 'insert_drive_file' },
          { name: 'Test 4', icon: 'insert_drive_file' },
        ],
      },
      {
        name: 'Sub-folder 2',
        icon: 'folder', // Default icon
        children: [{ name: 'Test 5', icon: 'insert_drive_file' }],
      },
    ],
  },
];

interface ExampleFlatNode {
  expandable: boolean;
  name: string;
  level: number;
  icon: string; // Added icon property
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatTreeModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatFormField,
    MatLabel,
    MatInputModule,
  ], // Added FormsModule
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'catalog-tree';
  selectedNode: ExampleFlatNode | null = null;
  selectedFoodNode: FoodNode | null = null; // Reference to the selected FoodNode

  fileCounter = 1;
  folderCounter = 1;

  private _transformer = (node: FoodNode, level: number): ExampleFlatNode => {
    return {
      expandable: !!node.children,
      name: node.name,
      level: level,
      icon: node.icon || (node.children ? 'folder' : 'insert_drive_file'), // Assign default icon
    };
  };

  treeControl = new FlatTreeControl<ExampleFlatNode>(
    (node) => node.level,
    (node) => node.expandable
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    (node) => node.level,
    (node) => node.expandable,
    (node) => node.children
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  constructor() {
    this.dataSource.data = TREE_DATA;
  }

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

  generateFileName(): string {
    return `file${this.fileCounter++}`;
  }

  generateFolderName(): string {
    return `folder${this.folderCounter++}`;
  }

  isSelected(node: ExampleFlatNode): boolean {
    return this.selectedNode === node;
  }

  selectNode(flatNode: ExampleFlatNode) {
    this.selectedNode = flatNode;
    this.selectedFoodNode = this.findNodeByName(
      this.dataSource.data,
      flatNode.name
    );
    console.log('Selected node:', this.selectedFoodNode);
  }

  add50Items() {
    const parentNode = this.selectedFoodNode
      ? this.selectedFoodNode
      : { name: 'Root', children: this.dataSource.data };
    if (!parentNode.children) {
      parentNode.children = [];
    }

    for (let i = 0; i < 50; i++) {
      parentNode.children.push({
        name: this.generateFileName(),
        icon: 'insert_drive_file',
      });
    }
    this.updateTree();
  }

  add50Folders() {
    const parentNode = this.selectedFoodNode
      ? this.selectedFoodNode
      : { name: 'Root', children: this.dataSource.data };
    if (!parentNode.children) {
      parentNode.children = [];
    }

    for (let i = 0; i < 50; i++) {
      const folderName = this.generateFolderName();
      parentNode.children.push({
        name: folderName,
        icon: 'folder',
        children: [],
      });
    }

    console.log('After adding folders:', parentNode.children);

    this.updateTree();
  }

  updateTree() {
    const expandedNodes = this.treeControl.dataNodes
      .filter((node) => this.treeControl.isExpanded(node))
      .map((node) => node.name);

    const selectedNodeName = this.selectedNode?.name;

    console.log('Expanded nodes before update:', expandedNodes);

    this.dataSource.data = [...this.dataSource.data];

    this.treeControl.dataNodes.forEach((node) => {
      if (expandedNodes.includes(node.name)) {
        this.treeControl.expand(node);
      }
    });

    if (selectedNodeName) {
      const restoredSelectedNode = this.treeControl.dataNodes.find(
        (node) => node.name === selectedNodeName
      );
      if (restoredSelectedNode) {
        this.selectedNode = restoredSelectedNode;
        this.selectedFoodNode = this.findNodeByName(
          this.dataSource.data,
          restoredSelectedNode.name
        );
      }
    }

    console.log('Tree updated:', this.dataSource.data);
  }

  findNodeByName(nodes: FoodNode[], name: string | undefined): FoodNode | null {
    if (!name) return null;

    for (const node of nodes) {
      if (node.name === name) {
        return node;
      }
      if (node.children) {
        const found = this.findNodeByName(node.children, name);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }
}
