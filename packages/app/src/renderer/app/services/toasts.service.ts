import { Service, inject } from '@angular/core';
import { generateUUID } from '@mockoon/commons';
import { ToastAction, ToastTypes } from 'src/renderer/app/models/toasts.model';
import {
  addToastAction,
  removeToastAction
} from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

@Service()
export class ToastsService {
  private store = inject(Store);

  /**
   * Display a toast
   *
   * @param type - type of toast
   * @param message - text message to display
   * @param action - optional action button configuration
   */
  public addToast(type: ToastTypes, message: string, action?: ToastAction) {
    this.store.update(
      addToastAction({
        UUID: generateUUID(),
        type,
        message,
        action
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
