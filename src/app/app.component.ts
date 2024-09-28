import { Component, Inject, OnDestroy, ViewEncapsulation } from '@angular/core';
import { DOCUMENT, CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  CdkDropList,
  CdkDrag,
  CdkDragMove,
} from '@angular/cdk/drag-drop';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { DropInfo, TreeNode, demoData } from './data';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'my-app',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    CdkDropList,
    CdkDrag,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
  ],
})
export class AppComponent implements OnDestroy {
  nodes: TreeNode[] = demoData;
  dropTargetIds: string[] = [];
  nodeLookup: { [id: string]: TreeNode } = {};
  dropActionTodo: DropInfo | null = null;
  selectedNode: TreeNode | null = null;
  selectedNodeName: string = '';
  selectedNodeIcon: string = 'description';
  availableIcons: string[] = [
    'description',
    'folder',
    'cloud',
    'storage',
    'list',
  ];
  isShiftPressed: boolean = false;

  private dragMoved$ = new Subject<CdkDragMove>();
  private destroy$ = new Subject<void>();

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.prepareDragDrop(this.nodes);

    this.dragMoved$
      .pipe(debounceTime(50), takeUntil(this.destroy$))
      .subscribe((event) => this.handleDragMoved(event));

    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    document.removeEventListener('keyup', this.onKeyUp.bind(this));
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Shift') {
      this.isShiftPressed = true;
    }
  }

  onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Shift') {
      this.isShiftPressed = false;
    }
  }

  prepareDragDrop(nodes: TreeNode[]) {
    nodes.forEach((node) => {
      this.dropTargetIds.push(node.id);
      this.nodeLookup[node.id] = node;
      if (node.children && node.children.length) {
        this.prepareDragDrop(node.children);
      }
    });
  }

  onDragMoved(event: CdkDragMove) {
    this.dragMoved$.next(event);
  }

  handleDragMoved(event: CdkDragMove) {
    let e = this.document.elementFromPoint(
      event.pointerPosition.x,
      event.pointerPosition.y
    );

    if (!e) {
      this.clearDragInfo();
      return;
    }

    let container = e.classList.contains('node-item')
      ? e
      : e.closest('.node-item');

    if (!container) {
      this.clearDragInfo();
      return;
    }

    const targetId = container.getAttribute('data-id');
    if (!targetId) {
      this.clearDragInfo();
      return;
    }

    this.dropActionTodo = {
      targetId: targetId,
    };

    const targetRect = container.getBoundingClientRect();
    const oneThird = targetRect.height / 3;

    if (event.pointerPosition.y - targetRect.top < oneThird) {
      this.dropActionTodo.action = 'before';
      container.classList.add('drop-before');
      container.classList.remove('drop-after', 'drop-inside');
    } else if (event.pointerPosition.y - targetRect.top > 2 * oneThird) {
      this.dropActionTodo.action = 'after';
      container.classList.add('drop-after');
      container.classList.remove('drop-before', 'drop-inside');
    } else {
      this.dropActionTodo.action = 'inside';
      container.classList.add('drop-inside');
      container.classList.remove('drop-before', 'drop-after');
    }

    this.showDragInfo();
  }

  drop(event: CdkDragDrop<TreeNode[]>) {
    if (!this.dropActionTodo) return;

    const draggedItemId = event.item.data;
    const parentItemId = event.previousContainer.id;
    const targetListId = this.getParentNodeId(
      this.dropActionTodo!.targetId,
      this.nodes,
      'main'
    );

    const draggedItem = this.nodeLookup[draggedItemId];
    const oldItemContainer =
      parentItemId != 'main'
        ? this.nodeLookup[parentItemId].children
        : this.nodes;
    const newContainer =
      targetListId && targetListId !== 'main'
        ? this.nodeLookup[targetListId].children
        : this.nodes;

    const newItem = this.isShiftPressed
      ? {
          ...draggedItem,
          id: `${draggedItem.id}_copy`,
          children: draggedItem.isFolder ? [...draggedItem.children] : [],
        }
      : draggedItem;

    if (!this.isShiftPressed) {
      const index = oldItemContainer.findIndex((c) => c.id === draggedItemId);
      if (index > -1) {
        oldItemContainer.splice(index, 1);
      }
    }

    switch (this.dropActionTodo!.action) {
      case 'before':
      case 'after':
        const targetIndex = newContainer.findIndex(
          (c) => c.id === this.dropActionTodo!.targetId
        );
        if (this.dropActionTodo!.action === 'before') {
          newContainer.splice(targetIndex, 0, newItem);
        } else {
          newContainer.splice(targetIndex + 1, 0, newItem);
        }
        break;

      case 'inside':
        this.nodeLookup[this.dropActionTodo!.targetId].children.push(newItem);
        this.nodeLookup[this.dropActionTodo!.targetId].isExpanded = true;
        break;
    }

    if (this.isShiftPressed) {
      this.nodeLookup[newItem.id] = newItem;
    }

    this.clearDragInfo(true);
  }

  getParentNodeId(
    id: string,
    nodesToSearch: TreeNode[],
    parentId: string
  ): string | null {
    for (let node of nodesToSearch) {
      if (node.id === id) return parentId;
      let ret = this.getParentNodeId(id, node.children, node.id);
      if (ret) return ret;
    }
    return null;
  }

  showDragInfo() {
    this.clearDragInfo();

    if (this.dropActionTodo) {
      const element = this.document.getElementById(
        'node-' + this.dropActionTodo.targetId
      );
      if (element) {
        element.classList.add('drop-' + this.dropActionTodo.action);
      }
    }
  }

  clearDragInfo(dropped = false) {
    if (dropped) {
      this.dropActionTodo = null;
    }
    this.document
      .querySelectorAll('.drop-before')
      .forEach((element) => element.classList.remove('drop-before'));
    this.document
      .querySelectorAll('.drop-after')
      .forEach((element) => element.classList.remove('drop-after'));
    this.document
      .querySelectorAll('.drop-inside')
      .forEach((element) => element.classList.remove('drop-inside'));

    this.document
      .querySelectorAll('.dragging')
      .forEach((element) => element.classList.remove('dragging'));
  }

  selectNode(node: TreeNode, event: MouseEvent) {
    event.stopPropagation();
    this.selectedNode = node;
    this.selectedNodeName = node.id;
    this.selectedNodeIcon = node.icon || 'description';
  }

  selectRoot(event: MouseEvent) {
    event.stopPropagation();
    this.selectedNode = null;
  }

  isAddEnabled(): boolean {
    return !this.selectedNode || this.selectedNode.isFolder === true;
  }

  toggleExpandNode(node: TreeNode, event: MouseEvent) {
    event.stopPropagation();
    node.isExpanded = !node.isExpanded;
  }

  changeNodeName() {
    if (this.selectedNode) {
      delete this.nodeLookup[this.selectedNode.id];

      this.selectedNode.id = this.selectedNodeName;
      this.selectedNode.icon = this.selectedNodeIcon;

      this.nodeLookup[this.selectedNode.id] = this.selectedNode;

      const index = this.dropTargetIds.indexOf(this.selectedNode.id);
      if (index !== -1) {
        this.dropTargetIds[index] = this.selectedNode.id;
      }
    }
  }

  isSelected(node: TreeNode): boolean {
    return this.selectedNode ? this.selectedNode.id === node.id : false;
  }

  addFiles() {
    const targetNode = this.selectedNode ?? this.nodes;

    for (let i = 0; i < 2; i++) {
      const randomName = `file-${Math.random().toString(36).substring(2, 8)}`;
      const newFile = {
        id: randomName,
        children: [],
        isFolder: false,
        icon: 'description',
      };

      if (Array.isArray(targetNode)) {
        targetNode.push(newFile);
      } else {
        targetNode.children.push(newFile);
      }

      this.dropTargetIds.push(newFile.id);
      this.nodeLookup[newFile.id] = newFile;
    }

    if (this.selectedNode) {
      this.selectedNode.isExpanded = true;
    }
  }

  addFolders() {
    const targetNode = this.selectedNode ?? this.nodes;

    for (let i = 0; i < 2; i++) {
      const randomName = `folder-${Math.random().toString(36).substring(2, 8)}`;
      const newFolder = {
        id: randomName,
        children: [],
        isFolder: true,
        icon: 'folder',
      };

      if (Array.isArray(targetNode)) {
        targetNode.push(newFolder);
      } else {
        targetNode.children.push(newFolder);
      }

      this.dropTargetIds.push(newFolder.id);
      this.nodeLookup[newFolder.id] = newFolder;
    }

    if (this.selectedNode) {
      this.selectedNode.isExpanded = true;
    }
  }
}
