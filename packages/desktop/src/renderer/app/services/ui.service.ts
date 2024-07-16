import { Injectable } from '@angular/core';
import {
  NgbModal,
  NgbModalOptions,
  NgbModalRef
} from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Observable, Subject, first } from 'rxjs';
import { AuthModalComponent } from 'src/renderer/app/components/modals/auth-modal/auth-modal.component';
import { ChangelogModalComponent } from 'src/renderer/app/components/modals/changelog-modal/changelog-modal.component';
import { CommandPaletteModalComponent } from 'src/renderer/app/components/modals/command-palette-modal/command-palette-modal.component';
import { ConfirmModalComponent } from 'src/renderer/app/components/modals/confirm-modal/confirm-modal.component';
import { DeployInstanceModalComponent } from 'src/renderer/app/components/modals/deploy-instance-modal/deploy-instance-modal.component';
import { DuplicateModalComponent } from 'src/renderer/app/components/modals/duplicate-modal/duplicate-modal.component';
import { ManageInstancesModalComponent } from 'src/renderer/app/components/modals/manage-instances-modal/manage-instances-modal.component';
import { SettingsModalComponent } from 'src/renderer/app/components/modals/settings-modal/settings-modal.component';
import { TemplatesModalComponent } from 'src/renderer/app/components/modals/templates-modal/templates-modal.component';
import { WelcomeModalComponent } from 'src/renderer/app/components/modals/welcome-modal/welcome-modal.component';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { UIState } from 'src/renderer/app/models/store.model';
import { ConfirmModalPayload } from 'src/renderer/app/models/ui.model';
import { EventsService } from 'src/renderer/app/services/events.service';
import { updateUIStateAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

const commonConfigs: { [key in string]: NgbModalOptions } = {
  small: {
    size: 'sm'
  },
  medium: {
    size: 'md'
  },
  large: {
    size: 'lg'
  },
  extraLarge: {
    size: 'xl'
  }
};

type ModalNames =
  | 'commandPalette'
  | 'settings'
  | 'changelog'
  | 'templates'
  | 'duplicate_to_environment'
  | 'welcome'
  | 'auth'
  | 'confirm'
  | 'deploy'
  | 'manageInstances';
type ModalWithPayload = Extract<
  ModalNames,
  'deploy' | 'manageInstances' | 'confirm'
>;
type ModalWithoutPayload = Exclude<
  ModalNames,
  'deploy' | 'manageInstances' | 'confirm'
>;

@Injectable({ providedIn: 'root' })
export class UIService {
  private modalsPayloads = {
    deploy: new BehaviorSubject<string>(null),
    manageInstances: new BehaviorSubject<string>(null),
    confirm: new BehaviorSubject<ConfirmModalPayload>(null)
  };
  private modals: {
    [key in ModalNames]: {
      component: any;
      options: NgbModalOptions;
    };
  } = {
    commandPalette: {
      component: CommandPaletteModalComponent,
      options: {
        size: 'lg',
        centered: false,
        backdrop: true,
        modalDialogClass:
          'modal-dialog-transparent-backdrop modal-dialog-rounded modal-dialog-max-height',
        backdropClass: 'modal-backdrop-transparent'
      }
    },
    settings: {
      component: SettingsModalComponent,
      options: commonConfigs.large
    },
    changelog: {
      component: ChangelogModalComponent,
      options: commonConfigs.extraLarge
    },
    templates: {
      component: TemplatesModalComponent,
      options: commonConfigs.large
    },
    duplicate_to_environment: {
      component: DuplicateModalComponent,
      options: commonConfigs.medium
    },
    welcome: {
      component: WelcomeModalComponent,
      options: commonConfigs.medium
    },
    auth: {
      component: AuthModalComponent,
      options: commonConfigs.medium
    },
    confirm: {
      component: ConfirmModalComponent,
      options: commonConfigs.medium
    },
    deploy: {
      component: DeployInstanceModalComponent,
      options: commonConfigs.large
    },
    manageInstances: {
      component: ManageInstancesModalComponent,
      options: commonConfigs.large
    }
  };
  private modalsInstances: { [key in ModalNames]: NgbModalRef } = {
    commandPalette: null,
    settings: null,
    changelog: null,
    templates: null,
    duplicate_to_environment: null,
    welcome: null,
    auth: null,
    confirm: null,
    deploy: null,
    manageInstances: null
  };

  constructor(
    private store: Store,
    private eventsService: EventsService,
    private ngbModal: NgbModal
  ) {}

  /**
   * Scroll to bottom of an element
   *
   * @param element
   */
  public scrollToBottom(element: Element) {
    setTimeout(() => {
      element.scrollTop = element.scrollHeight;
    });
  }

  /**
   * Update the UI state with new properties
   *
   * @param newProperties
   */
  public updateUIState(newProperties: Partial<UIState>) {
    this.store.update(updateUIStateAction(newProperties));
  }

  /**
   * Focus an input by name
   *
   * @param input
   */
  public focusInput(input: FocusableInputs) {
    this.eventsService.focusInput.next(input);
  }

  public getModalPayload$<T extends ModalWithPayload>(
    modalName: T
  ): (typeof this.modalsPayloads)[T] {
    return this.modalsPayloads[modalName];
  }

  /**
   * Open a modal.
   * Some modals require a payload to be passed.
   *
   * @param modalName
   */

  public openModal(modalName: 'confirm', payload: ConfirmModalPayload): void;
  public openModal(modalName: 'deploy', payload: string): void;
  public openModal(modalName: 'manageInstances', payload?: string): void;
  public openModal(modalName: ModalWithoutPayload): void;
  public openModal(
    modalName: ModalNames,
    payload?: string | ConfirmModalPayload | never
  ): void {
    if (this.modalsInstances[modalName]) {
      return;
    }

    if (payload !== undefined) {
      this.modalsPayloads[modalName].next(payload);
    }

    Object.keys(this.modalsInstances).forEach((modal: ModalNames) => {
      this.closeModal(modal);
    });

    this.modalsInstances[modalName] = this.ngbModal.open(
      this.modals[modalName].component,
      this.modals[modalName].options
    );

    this.modalsInstances[modalName].hidden.subscribe(() => {
      this.modalsInstances[modalName] = null;
    });
  }

  public closeModal(modalName: ModalNames, reason?: any) {
    if (this.modalsInstances[modalName]) {
      this.modalsInstances[modalName].close(reason);

      this.modalsPayloads[modalName]?.next(null);
    }
  }

  public dismissModal(modalName: ModalNames, reason?: any) {
    if (this.modalsInstances[modalName]) {
      this.modalsInstances[modalName].dismiss(reason);
    }
  }

  /**
   * Get a modal instance
   *
   * @param modalName
   */
  public getModalInstance(modalName: ModalNames) {
    return this.modalsInstances[modalName];
  }

  /**
   * Show a confirmation dialog and return an observable
   */
  public showConfirmDialog(
    payload: Omit<ConfirmModalPayload, 'confirmed$'>
  ): Observable<boolean> {
    const confirmed$ = new Subject<boolean>();

    this.openModal('confirm', { ...payload, confirmed$ });

    /**
     * Complete the Subject using first() as we only need the first value.
     * Not completing the Subject can cause multiple successives modals to be ignored
     * when used in combination with concat for example.
     */
    return confirmed$.pipe(first());
  }
}
