import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { DragState } from 'src/renderer/app/models/ui.model';

@Injectable({ providedIn: 'root' })
export class DragService {
  public dragStopped$: Subject<void> = new Subject();
  public dropzone$: Subject<string | number> = new Subject();
  private initialState: DragState = {
    elementId: null,
    dragContainer: null,
    isContainer: null,
    parentId: null,
    nativeElement: null
  };
  private state: DragState = this.initialState;

  constructor() {}

  public startDragging(element: DragState) {
    this.state = element;
  }

  public stopDragging() {
    this.state = this.initialState;
    this.dragStopped$.next();
  }

  public draggedElement() {
    return this.state;
  }

  public setCurrentDropzone(dropzoneId: string | number) {
    this.dropzone$.next(dropzoneId);
  }
}
