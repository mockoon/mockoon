import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AuthModalComponent } from 'src/renderer/app/components/modals/auth-modal/auth-modal.component';
import { ChangelogModalComponent } from 'src/renderer/app/components/modals/changelog-modal/changelog-modal.component';
import { CommandPaletteModalComponent } from 'src/renderer/app/components/modals/command-palette-modal/command-palette-modal.component';
import { ConfirmModalComponent } from 'src/renderer/app/components/modals/confirm-modal/confirm-modal.component';
import { DuplicateModalComponent } from 'src/renderer/app/components/modals/duplicate-modal/duplicate-modal.component';
import { EditorModalComponent } from 'src/renderer/app/components/modals/editor-modal/editor-modal.component';
import { SettingsModalComponent } from 'src/renderer/app/components/modals/settings-modal/settings-modal.component';
import { TemplatesModalComponent } from 'src/renderer/app/components/modals/templates-modal/templates-modal.component';
import { WelcomeModalComponent } from 'src/renderer/app/components/modals/welcome-modal/welcome-modal.component';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { UIStateProperties } from 'src/renderer/app/models/store.model';
import { EventsService } from 'src/renderer/app/services/events.service';
import { updateUIStateAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

const commonConfigs = {
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

@Injectable({ providedIn: 'root' })
export class UIService {
  private modals = {
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
    editor: {
      component: EditorModalComponent,
      options: commonConfigs.large
    },
    auth: {
      component: AuthModalComponent,
      options: commonConfigs.medium
    },
    confirm: {
      component: ConfirmModalComponent,
      options: commonConfigs.medium
    }
  };
  private modalsInstances: { [key in keyof typeof this.modals]: NgbModalRef } =
    {
      commandPalette: null,
      settings: null,
      changelog: null,
      templates: null,
      duplicate_to_environment: null,
      welcome: null,
      editor: null,
      auth: null,
      confirm: null
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
  public updateUIState(newProperties: UIStateProperties) {
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

  /**
   * Open a modal
   *
   * @param modalName
   */
  public openModal(modalName: keyof typeof this.modals) {
    if (this.modalsInstances[modalName]) {
      return;
    }

    Object.keys(this.modalsInstances).forEach(
      (modal: keyof typeof this.modals) => {
        this.closeModal(modal);
      }
    );

    this.modalsInstances[modalName] = this.ngbModal.open(
      this.modals[modalName].component,
      this.modals[modalName].options
    );

    this.modalsInstances[modalName].hidden.subscribe(() => {
      this.modalsInstances[modalName] = null;
    });
  }

  public closeModal(modalName: keyof typeof this.modals, reason?: any) {
    if (this.modalsInstances[modalName]) {
      this.modalsInstances[modalName].close(reason);
    }
  }

  public dismissModal(modalName: keyof typeof this.modals, reason?: any) {
    if (this.modalsInstances[modalName]) {
      this.modalsInstances[modalName].dismiss(reason);
    }
  }

  /**
   * Get a modal instance
   *
   * @param modalName
   */
  public getModalInstance(modalName: keyof typeof this.modals) {
    return this.modalsInstances[modalName];
  }
}
