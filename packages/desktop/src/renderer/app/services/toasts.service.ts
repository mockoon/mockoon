import { Injectable } from '@angular/core';
import { generateUUID } from '@mockoon/commons';
import { ToastTypes } from 'src/renderer/app/models/toasts.model';
import {
  addToastAction,
  removeToastAction
} from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

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
        UUID: generateUUID(),
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
