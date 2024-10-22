import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { DragState } from 'src/renderer/app/models/ui.model';

@Injectable({ providedIn: 'root' })
export class DragService {
  public dragStopped$ = new Subject<void>();
  public dropzone$ = new Subject<string | number>();
  private initialState: DragState = {
    elementId: null,
    dragContainer: null,
    isContainer: null,
    parentId: null,
    nativeElement: null
  };
  private state: DragState = this.initialState;

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
