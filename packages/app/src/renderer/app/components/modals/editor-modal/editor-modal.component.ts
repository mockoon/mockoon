import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { EditorComponent } from 'src/renderer/app/components/editor/editor.component';
import { defaultEditorOptions } from 'src/renderer/app/constants/editor.constants';
import { UIService } from 'src/renderer/app/services/ui.service';

@Component({
  selector: 'app-editor-modal',
  templateUrl: './editor-modal.component.html',
  styleUrls: ['editor-modal.component.scss'],
  imports: [EditorComponent, AsyncPipe]
})
export class EditorModalComponent {
  private uiService = inject(UIService);

  public editorModalPayload$ = this.uiService.getModalPayload$('editor');
  public defaultEditorConfig = {
    ...defaultEditorOptions,
    options: { ...defaultEditorOptions.options, useWorker: true }
  };

  public close() {
    this.uiService.closeModal('editor');
  }
}
