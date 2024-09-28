import { FlatTreeControl } from '@angular/cdk/tree';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
  MatTreeModule,
} from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface FoodNode {
  name: string;
  children?: FoodNode[];
}

const TREE_DATA: FoodNode[] = [
  {
    name: 'Folder 1',
    children: [{ name: 'Test' }, { name: 'Test 2' }],
  },
  {
    name: 'Folder 2',
    children: [
      {
        name: 'Sub-folder 1',
        children: [{ name: 'Test3' }, { name: 'Test 4' }],
      },
      {
        name: 'Sub-folder 2',
        children: [{ name: 'Test 5' }],
      },
    ],
  },
];

interface ExampleFlatNode {
  expandable: boolean;
  name: string;
  level: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatTreeModule, MatButtonModule, MatIconModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'catalog-tree';
  selectedNode: ExampleFlatNode | null = null;

  fileCounter = 1;
  folderCounter = 1;

  private _transformer = (node: FoodNode, level: number): ExampleFlatNode => {
    return {
      expandable: !!node.children,
      name: node.name,
      level: level,
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
    console.log('Selected node:', this.selectedNode);
  }

  add50Items() {
    const parentNode = this.findNodeByName(
      this.dataSource.data,
      this.selectedNode?.name
    );
    if (parentNode) {
      if (!parentNode.children) {
        parentNode.children = [];
      }

      for (let i = 0; i < 50; i++) {
        parentNode.children.push({ name: this.generateFileName() });
      }
      this.updateTree();
    }
  }

  add50Folders() {
    const parentNode = this.findNodeByName(
      this.dataSource.data,
      this.selectedNode?.name
    );
    if (parentNode) {
      if (!parentNode.children) {
        parentNode.children = [];
      }

      for (let i = 0; i < 50; i++) {
        const folderName = this.generateFolderName();
        parentNode.children.push({
          name: folderName,
          children: [],
        });
      }

      console.log('After adding folders:', parentNode.children);

      this.updateTree();
    }
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
