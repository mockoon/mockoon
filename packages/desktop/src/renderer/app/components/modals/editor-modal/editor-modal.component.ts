import { ChangeDetectionStrategy, Component } from '@angular/core';
import { defaultEditorOptions } from 'src/renderer/app/constants/editor.constants';
import { UIService } from 'src/renderer/app/services/ui.service';

@Component({
  selector: 'app-editor-modal',
  templateUrl: './editor-modal.component.html',
  styleUrls: ['editor-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditorModalComponent {
  public editorModalPayload$ = this.uiService.getModalPayload$('editor');
  public defaultEditorConfig = {
    ...defaultEditorOptions,
    options: { ...defaultEditorOptions.options, useWorker: true }
  };

  constructor(private uiService: UIService) {}

  public close() {
    this.uiService.closeModal('editor');
  }
}
