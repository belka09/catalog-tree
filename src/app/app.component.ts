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
import { FormsModule } from '@angular/forms'; // Import FormsModule for two-way data binding

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
    FormsModule,
  ],
})
export class AppComponent implements OnDestroy {
  nodes: TreeNode[] = demoData;
  dropTargetIds: string[] = [];
  nodeLookup: { [id: string]: TreeNode } = {};
  dropActionTodo: DropInfo | null = null;
  selectedNode: TreeNode | null = null; // Track the currently selected node
  selectedNodeName: string = ''; // The name of the selected node for editing

  private dragMoved$ = new Subject<CdkDragMove>();
  private destroy$ = new Subject<void>();

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.prepareDragDrop(this.nodes);

    this.dragMoved$
      .pipe(debounceTime(50), takeUntil(this.destroy$))
      .subscribe((event) => this.handleDragMoved(event));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

    // Ensure that the data-id attribute is present and not null
    const targetId = container.getAttribute('data-id');
    if (!targetId) {
      this.clearDragInfo();
      return;
    }

    // Now it's safe to assign targetId to this.dropActionTodo
    this.dropActionTodo = {
      targetId: targetId, // Safe assignment after null check
    };

    const targetRect = container.getBoundingClientRect();
    const oneThird = targetRect.height / 3;

    if (event.pointerPosition.y - targetRect.top < oneThird) {
      // Drop before
      this.dropActionTodo.action = 'before';
      container.classList.add('drop-before');
      container.classList.remove('drop-after', 'drop-inside');
    } else if (event.pointerPosition.y - targetRect.top > 2 * oneThird) {
      // Drop after
      this.dropActionTodo.action = 'after';
      container.classList.add('drop-after');
      container.classList.remove('drop-before', 'drop-inside');
    } else {
      // Drop inside
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

    // Get the target node (dropActionTodo.targetId)
    const targetNode = this.nodeLookup[this.dropActionTodo.targetId];

    // Block the drop if the target node is not a folder
    if (!targetNode.isFolder) {
      console.warn('Cannot drop items into a file.');
      return;
    }

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

    let i = oldItemContainer.findIndex((c) => c.id === draggedItemId);
    oldItemContainer.splice(i, 1);

    switch (this.dropActionTodo!.action) {
      case 'before':
      case 'after':
        const targetIndex = newContainer.findIndex(
          (c) => c.id === this.dropActionTodo!.targetId
        );
        if (this.dropActionTodo!.action == 'before') {
          newContainer.splice(targetIndex, 0, draggedItem);
        } else {
          newContainer.splice(targetIndex + 1, 0, draggedItem);
        }
        break;

      case 'inside':
        this.nodeLookup[this.dropActionTodo!.targetId].children.push(
          draggedItem
        );
        this.nodeLookup[this.dropActionTodo!.targetId].isExpanded = true;
        break;
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
  }

  // Set the clicked node as the selected node and update the input field
  selectNode(node: TreeNode) {
    this.selectedNode = node;
    this.selectedNodeName = node.id; // Prepopulate the input field with the current name
  }

  // Toggle the node expansion/collapse on click
  toggleExpandNode(node: TreeNode) {
    node.isExpanded = !node.isExpanded;
  }

  // Change the name of the selected node and update nodeLookup
  changeNodeName() {
    if (this.selectedNode) {
      // Remove the old reference in nodeLookup
      delete this.nodeLookup[this.selectedNode.id];

      // Update the node's name
      this.selectedNode.id = this.selectedNodeName;

      // Add the updated node back to nodeLookup with the new name
      this.nodeLookup[this.selectedNode.id] = this.selectedNode;

      // Update dropTargetIds to ensure it matches the new name
      const index = this.dropTargetIds.indexOf(this.selectedNode.id);
      if (index !== -1) {
        this.dropTargetIds[index] = this.selectedNode.id;
      }
    }
  }

  isSelected(node: TreeNode): boolean {
    return this.selectedNode ? this.selectedNode.id === node.id : false;
  }

  // Add 2 random files inside the selected node or root if no node selected
  addFiles() {
    const targetNode = this.selectedNode ?? this.nodes; // If no node is selected, use root (this.nodes)

    for (let i = 0; i < 2; i++) {
      const randomName = `file-${Math.random().toString(36).substring(2, 8)}`;
      const newFile = { id: randomName, children: [], isFolder: false };

      if (Array.isArray(targetNode)) {
        // Add to the root if targetNode is the root (this.nodes)
        targetNode.push(newFile);
      } else {
        // Add to the selected node's children
        targetNode.children.push(newFile);
      }

      // Update the dropTargetIds and nodeLookup to include the new file
      this.dropTargetIds.push(newFile.id);
      this.nodeLookup[newFile.id] = newFile;
    }

    // Ensure the selected node is expanded if it's a folder
    if (this.selectedNode) {
      this.selectedNode.isExpanded = true;
    }
  }

  // Add 2 folders without any files inside, in the selected node or root if no node selected
  addFolders() {
    const targetNode = this.selectedNode ?? this.nodes; // If no node is selected, use root (this.nodes)

    for (let i = 0; i < 2; i++) {
      const randomName = `folder-${Math.random().toString(36).substring(2, 8)}`;
      const newFolder = {
        id: randomName,
        children: [],
        isFolder: true, // Explicitly mark as folder
      };

      if (Array.isArray(targetNode)) {
        // Add to the root if targetNode is the root (this.nodes)
        targetNode.push(newFolder);
      } else {
        // Add to the selected node's children
        targetNode.children.push(newFolder);
      }

      // Update the dropTargetIds and nodeLookup to include the new folder
      this.dropTargetIds.push(newFolder.id);
      this.nodeLookup[newFolder.id] = newFolder;
    }

    // Ensure the selected node is expanded if it's a folder
    if (this.selectedNode) {
      this.selectedNode.isExpanded = true;
    }
  }
}
