import { Injectable, inject } from '@angular/core';
import {
  NgbModal,
  NgbModalOptions,
  NgbModalRef
} from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Observable, Subject, first } from 'rxjs';
import { AuthIframeModalComponent } from 'src/renderer/app/components/modals/auth-iframe-modal/auth-iframe-modal.component';
import { AuthModalComponent } from 'src/renderer/app/components/modals/auth-modal/auth-modal.component';
import { ChangelogModalComponent } from 'src/renderer/app/components/modals/changelog-modal/changelog-modal.component';
import { CommandPaletteModalComponent } from 'src/renderer/app/components/modals/command-palette-modal/command-palette-modal.component';
import { ConfirmModalComponent } from 'src/renderer/app/components/modals/confirm-modal/confirm-modal.component';
import { DeployInstanceModalComponent } from 'src/renderer/app/components/modals/deploy-instance-modal/deploy-instance-modal.component';
import { DuplicateModalComponent } from 'src/renderer/app/components/modals/duplicate-modal/duplicate-modal.component';
import { EditorModalComponent } from 'src/renderer/app/components/modals/editor-modal/editor-modal.component';
import { FeedbackModalComponent } from 'src/renderer/app/components/modals/feedback-modal/feedback-modal.component';
import { ManageInstancesModalComponent } from 'src/renderer/app/components/modals/manage-instances-modal/manage-instances-modal.component';
import { OpenapiImportModalComponent } from 'src/renderer/app/components/modals/openapi-import-modal/openapi-import-modal.component';
import { SelfHostingInstructionsModalComponent } from 'src/renderer/app/components/modals/self-hosting-instructions-modal/self-hosting-instructions-modal.component';
import { SettingsModalComponent } from 'src/renderer/app/components/modals/settings-modal/settings-modal.component';
import { TemplatesModalComponent } from 'src/renderer/app/components/modals/templates-modal/templates-modal.component';
import { WelcomeModalComponent } from 'src/renderer/app/components/modals/welcome-modal/welcome-modal.component';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { UIState } from 'src/renderer/app/models/store.model';
import {
  ConfirmModalPayload,
  EditorModalPayload,
  ManageInstancesModalPayload,
  OpenApiImportModalPayload
} from 'src/renderer/app/models/ui.model';
import { EventsService } from 'src/renderer/app/services/events.service';
import { updateUIStateAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

const commonConfigs: Record<
  'small' | 'medium' | 'large' | 'extraLarge',
  NgbModalOptions
> = {
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
  | 'feedback'
  | 'changelog'
  | 'templates'
  | 'duplicate_to_environment'
  | 'welcome'
  | 'auth'
  | 'authIframe'
  | 'confirm'
  | 'deploy'
  | 'editor'
  | 'manageInstances'
  | 'openApiImport'
  | 'selfHostingInstructions';
type ModalWithPayload = Extract<
  ModalNames,
  | 'deploy'
  | 'editor'
  | 'manageInstances'
  | 'confirm'
  | 'openApiImport'
  | 'selfHostingInstructions'
>;
type ModalWithoutPayload = Exclude<
  ModalNames,
  | 'deploy'
  | 'editor'
  | 'manageInstances'
  | 'confirm'
  | 'openApiImport'
  | 'selfHostingInstructions'
>;

@Injectable({ providedIn: 'root' })
export class UIService {
  private store = inject(Store);
  private eventsService = inject(EventsService);
  private ngbModal = inject(NgbModal);

  private modalsPayloads = {
    deploy: new BehaviorSubject<string>(null),
    editor: new BehaviorSubject<EditorModalPayload>(null),
    manageInstances: new BehaviorSubject<ManageInstancesModalPayload>(null),
    confirm: new BehaviorSubject<ConfirmModalPayload>(null),
    openApiImport: new BehaviorSubject<OpenApiImportModalPayload>(null),
    selfHostingInstructions: new BehaviorSubject<string>(null)
  };
  private modals: Record<
    ModalNames,
    {
      component: any;
      options: NgbModalOptions;
    }
  > = {
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
    feedback: {
      component: FeedbackModalComponent,
      options: commonConfigs.medium
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
    authIframe: {
      component: AuthIframeModalComponent,
      options: {
        ...commonConfigs.medium,
        keyboard: false,
        modalDialogClass: 'modal-dialog-rounded'
      }
    },
    confirm: {
      component: ConfirmModalComponent,
      options: commonConfigs.medium
    },
    deploy: {
      component: DeployInstanceModalComponent,
      options: commonConfigs.large
    },
    editor: {
      component: EditorModalComponent,
      options: commonConfigs.large
    },
    openApiImport: {
      component: OpenapiImportModalComponent,
      options: commonConfigs.large
    },
    manageInstances: {
      component: ManageInstancesModalComponent,
      options: commonConfigs.large
    },
    selfHostingInstructions: {
      component: SelfHostingInstructionsModalComponent,
      options: commonConfigs.large
    }
  };
  private modalsInstances: Record<ModalNames, NgbModalRef> = {
    commandPalette: null,
    settings: null,
    feedback: null,
    changelog: null,
    templates: null,
    duplicate_to_environment: null,
    welcome: null,
    auth: null,
    authIframe: null,
    confirm: null,
    deploy: null,
    editor: null,
    openApiImport: null,
    manageInstances: null,
    selfHostingInstructions: null
  };

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

  public openModal(modalName: 'editor', payload: EditorModalPayload): void;
  public openModal(modalName: 'confirm', payload: ConfirmModalPayload): void;
  public openModal(
    modalName: 'deploy' | 'selfHostingInstructions',
    payload: string
  ): void;
  public openModal(
    modalName: 'manageInstances',
    payload: ManageInstancesModalPayload
  ): void;
  public openModal(
    modalName: 'openApiImport',
    payload: OpenApiImportModalPayload
  ): void;
  public openModal(modalName: ModalWithoutPayload): void;
  public openModal(
    modalName: ModalNames,
    payload?:
      | string
      | ConfirmModalPayload
      | ManageInstancesModalPayload
      | EditorModalPayload
      | OpenApiImportModalPayload
      | never
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
     * Not completing the Subject can cause multiple successive modals to be ignored
     * when used in combination with concat for example.
     */
    return confirmed$.pipe(first());
  }
}
