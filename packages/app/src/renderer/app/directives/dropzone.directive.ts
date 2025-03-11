import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { ReorderAction, ReorderActionType } from '@mockoon/commons';
import { Subscription } from 'rxjs';
import { DragService } from 'src/renderer/app/services/drag.service';

/**
 * Directive to make an element droppable
 */
@Directive({ selector: '[appDropzone]' })
export class DropzoneDirective implements OnInit, OnDestroy {
  // arbitrary name of the dragged element's container (avoid drag and drop between different containers)
  @Input()
  public dragContainer: string;
  // Id of the dragged element's parent
  @Input()
  public dragParentId: string | 'root';
  // chain of dragged element's parent ids
  @Input()
  public dragParentChainId: string | 'root';
  // UUID or index of the target element (dropzone)
  @Input()
  public dragId: number | string;
  // is the dropzone a container (drop action type can be INSIDE)
  @Input()
  public dragIsContainer: boolean;
  // emit when the drop action is performed
  @Output()
  public dropped = new EventEmitter<ReorderAction<string | number>>();
  private boundaries: {
    start: number;
    upperMiddle: number;
    middle: number;
    lowerMiddle: number;
    end: number;
  };
  private dragStoppedSub: Subscription;
  private currentDropzoneSub: Subscription;
  private currentReorderAction: ReorderActionType = null;
  private _dragEnabled: boolean;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private dragService: DragService
  ) {
    this.elementRef.nativeElement.classList.add('drag-item');
  }

  @Input()
  public set dragEnabled(enabled: boolean) {
    this._dragEnabled = enabled;
  }

  @HostListener('dragenter', ['$event'])
  public onDragEnter(event: DragEvent) {
    // set new dropzone before any check to reset classes even when entering prohibited dropzones
    this.dragService.setCurrentDropzone(this.dragId);

    if (!this.canDropInside() && !this.canReorder()) {
      return;
    }

    event.preventDefault();

    const rect = this.elementRef.nativeElement.getBoundingClientRect();

    this.boundaries = {
      start: rect.y,
      upperMiddle: rect.y + rect.height / 4,
      middle: rect.y + rect.height / 2,
      lowerMiddle: rect.y + (rect.height / 4) * 3,
      end: rect.y + rect.height
    };
  }

  @HostListener('dragover', ['$event'])
  public onDragOver(event: DragEvent) {
    if (!this.canDropInside() && !this.canReorder()) {
      return;
    }

    event.preventDefault();

    event.dataTransfer.dropEffect = 'move';

    if (this.canReorder() && !this.canDropInside()) {
      if (
        event.clientY >= this.boundaries.start &&
        event.clientY < this.boundaries.middle
      ) {
        this.elementRef.nativeElement.classList.add('drag-highlight-top');
        this.elementRef.nativeElement.classList.remove('drag-highlight-bottom');
        this.currentReorderAction = ReorderActionType.BEFORE;
      } else if (
        event.clientY >= this.boundaries.middle &&
        event.clientY <= this.boundaries.end
      ) {
        this.elementRef.nativeElement.classList.add('drag-highlight-bottom');
        this.elementRef.nativeElement.classList.remove('drag-highlight-top');
        this.currentReorderAction = ReorderActionType.AFTER;
      }
    } else if (this.canReorder() && this.canDropInside()) {
      if (
        event.clientY >= this.boundaries.start &&
        event.clientY < this.boundaries.upperMiddle
      ) {
        this.elementRef.nativeElement.classList.remove('drag-highlight');
        this.elementRef.nativeElement.classList.remove('drag-highlight-bottom');
        this.elementRef.nativeElement.classList.add('drag-highlight-top');
        this.currentReorderAction = ReorderActionType.BEFORE;
      } else if (
        event.clientY >= this.boundaries.upperMiddle &&
        event.clientY < this.boundaries.lowerMiddle
      ) {
        this.elementRef.nativeElement.classList.remove('drag-highlight-top');
        this.elementRef.nativeElement.classList.remove('drag-highlight-bottom');
        this.elementRef.nativeElement.classList.add('drag-highlight');
        this.currentReorderAction = ReorderActionType.INSIDE;
      } else if (
        event.clientY >= this.boundaries.lowerMiddle &&
        event.clientY <= this.boundaries.end
      ) {
        this.elementRef.nativeElement.classList.remove('drag-highlight-top');
        this.elementRef.nativeElement.classList.remove('drag-highlight');
        this.elementRef.nativeElement.classList.add('drag-highlight-bottom');
        this.currentReorderAction = ReorderActionType.AFTER;
      }
    } else if (!this.canReorder() && this.canDropInside()) {
      if (
        event.clientY >= this.boundaries.start &&
        event.clientY <= this.boundaries.end
      ) {
        this.elementRef.nativeElement.classList.add('drag-highlight');
        this.currentReorderAction = ReorderActionType.INSIDE;
      }
    }
  }

  @HostListener('dragleave', ['$event'])
  public onDragLeave(event: DragEvent) {
    // avoid leave event trigger when drag over child element
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.clearClasses();
    }
  }

  @HostListener('drop', ['$event'])
  public onDrop(event: DragEvent) {
    this.clearClasses();

    if (!this.canDropInside() && !this.canReorder()) {
      return;
    }

    event.preventDefault();

    this.dropped.emit({
      sourceId: this.dragService.draggedElement().elementId,
      sourceParentId: this.dragService.draggedElement().parentId,
      targetId: this.dragId,
      targetParentId: this.dragParentId,
      reorderActionType: this.currentReorderAction,
      isSourceContainer: this.dragService.draggedElement().isContainer,
      isTargetContainer: this.dragIsContainer
    });
  }

  ngOnInit() {
    this.dragStoppedSub = this.dragService.dragStopped$.subscribe(() => {
      this.clearClasses();
    });

    this.currentDropzoneSub = this.dragService.dropzone$.subscribe(
      (dragUUID) => {
        if (dragUUID !== this.dragId) {
          this.clearClasses();
        }
      }
    );
  }

  ngOnDestroy() {
    this.dragStoppedSub.unsubscribe();
    this.currentDropzoneSub?.unsubscribe();
  }

  /**
   * Remove all classes on the drop element
   */
  private clearClasses() {
    this.elementRef.nativeElement.classList.remove(
      'drag-highlight',
      'drag-highlight-top',
      'drag-highlight-bottom'
    );
  }

  /**
   * Check that the dragged element can be reorder relatively to the dropzone
   * - is in same container
   * - not dragging over itself
   * - not dragging over any child of the dragged element
   *
   * @returns
   */
  private canReorder(): boolean {
    return (
      this._dragEnabled &&
      this.isInSameContainer() &&
      !this.isSelf() &&
      !this.isContainerChild()
    );
  }

  /**
   * Check that the dragged element can be dropped inside the dropzone
   * - is in same container
   * - not dragging over itself
   * - dropzone is a container
   * - not dragging over a child of the dragged element
   *
   * @returns
   */
  private canDropInside(): boolean {
    return (
      this._dragEnabled &&
      this.isInSameContainer() &&
      !this.isSelf() &&
      this.dragIsContainer === true &&
      this.dragId !== this.dragService.draggedElement().parentId &&
      !this.isContainerChild()
    );
  }

  /**
   * Check that we are dropping over a child of the dragged container element
   * (Only applies to container elements)
   *
   * @returns
   */
  private isContainerChild() {
    return (
      this.dragService.draggedElement().isContainer &&
      this.dragParentChainId.includes(
        this.dragService.draggedElement().elementId as string | 'root'
      )
    );
  }

  /**
   * Check that we are dropping the dragged element over itself
   *
   * @returns
   */
  private isSelf() {
    return this.dragService.draggedElement().elementId === this.dragId;
  }

  /**
   * Check that we are only drag and dropping elements inside the same container
   *
   * @returns
   */
  private isInSameContainer() {
    return (
      this.dragService.draggedElement().dragContainer === this.dragContainer
    );
  }
}
