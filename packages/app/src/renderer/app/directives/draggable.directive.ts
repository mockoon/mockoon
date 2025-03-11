import {
  AfterViewInit,
  ContentChild,
  Directive,
  ElementRef,
  HostListener,
  Input
} from '@angular/core';
import { DragService } from 'src/renderer/app/services/drag.service';

/**
 * Directive to make an element draggable
 */
@Directive({ selector: '[appDraggable]' })
export class DraggableDirective implements AfterViewInit {
  // Define a #dragHandle on a child to use it as the drag handle
  @ContentChild('dragHandle')
  public dragHandle: ElementRef<HTMLElement>;
  // arbitrary name of the dragged element's container (avoid drag and drop between different containers)
  @Input()
  public dragContainer: string;
  // Id of the dragged element's parent
  @Input()
  public dragParentId: string | 'root';
  // UUID or index of the dragged element
  @Input()
  public dragId: number | string;
  // Is the dragged element a container (can contain other elements)
  @Input()
  public dragIsContainer: boolean;
  private _dragEnabled: boolean;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private dragService: DragService
  ) {}

  @Input()
  public set dragEnabled(enabled: boolean) {
    this._dragEnabled = enabled;
    this.updateDraggable();
  }

  /**
   * Only enable drag when the handle is used (if a handle was found)
   *
   * @param event
   */
  @HostListener('mousedown', ['$event'])
  public onMouseDown(event: MouseEvent) {
    if (
      event.target === this.dragHandle?.nativeElement ||
      this.dragHandle?.nativeElement.contains(event.target as HTMLElement)
    ) {
      this.elementRef.nativeElement.draggable = this._dragEnabled;
    }
  }

  @HostListener('dragstart', ['$event'])
  public onDragStart(event: DragEvent) {
    (event.target as any).style.opacity = 1;
    this.dragService.startDragging({
      elementId: this.dragId,
      dragContainer: this.dragContainer,
      parentId: this.dragParentId,
      isContainer: this.dragIsContainer,
      nativeElement: this.elementRef.nativeElement
    });
  }

  @HostListener('dragend', ['$event'])
  public onDragEnd(event: DragEvent) {
    event.preventDefault();
    this.dragService.stopDragging();
    this.updateDraggable();
  }

  ngAfterViewInit() {
    this.updateDraggable();
  }

  /**
   * If a drag handle was found, disable drag by default
   */
  private updateDraggable() {
    if (!this.dragHandle) {
      this.elementRef.nativeElement.draggable = this._dragEnabled;
    } else {
      this.elementRef.nativeElement.draggable = false;
    }
  }
}
