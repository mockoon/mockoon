import { Injectable } from '@angular/core';
import { ToastTypes } from 'src/app/models/toasts.model';
import { addToastAction, removeToastAction } from 'src/app/stores/actions';
import { Store } from 'src/app/stores/store';
import { v1 as uuid } from 'uuid';

@Injectable({ providedIn: 'root' })
export class ToastsService {
  constructor(private store: Store) {}

  /**
   * Display a toast
   *
   * @param type - type of toast
   * @param message - text message to display
   */
  public addToast(type: ToastTypes, message: string) {
    this.store.update(
      addToastAction({
        UUID: uuid(),
        type,
        message
      })
    );
  }

  /**
   * Remove a toast
   *
   * @param toastUUID
   */
  public removeToast(toastUUID: string) {
    this.store.update(removeToastAction(toastUUID));
  }
}
