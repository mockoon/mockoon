import { Injectable } from '@angular/core';
import { addToastAction, removeToastAction } from 'src/app/stores/actions';
import { Store } from 'src/app/stores/store';
import * as uuid from 'uuid/v1';

export type ToastTypes = 'error' | 'success' | 'warning';
export type Toast = { UUID: string, message: string, type: ToastTypes };

@Injectable()
export class ToastsService {
  constructor(private store: Store) { }

  /**
   * Display a toast
   *
   * @param type - type of toast
   * @param message - text message to display
   */
  public addToast(type: ToastTypes, message: string) {
    this.store.update(addToastAction({
      UUID: uuid(),
      type,
      message
    }));
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
