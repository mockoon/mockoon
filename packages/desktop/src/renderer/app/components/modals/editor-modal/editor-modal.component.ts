import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EditorModalPayload } from 'src/renderer/app/models/editor.model';
import { EventsService } from 'src/renderer/app/services/events.service';
import { UIService } from 'src/renderer/app/services/ui.service';

@Component({
  selector: 'app-editor-modal',
  templateUrl: './editor-modal.component.html',
  styleUrls: ['editor-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditorModalComponent implements OnInit {
  public editorModalPayload$: Observable<EditorModalPayload>;
  private defaultEditorConfig = {
    options: {
      fontSize: '1rem',
      wrap: 'free',
      showPrintMargin: false,
      tooltipFollowsMouse: false,
      useWorker: true
    },
    mode: 'json',
    theme: 'editor-theme'
  };

  constructor(
    private uiService: UIService,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.editorModalPayload$ = this.eventsService.editorModalPayload$.pipe(
      map((editorModalPayload) => ({
        ...editorModalPayload,
        editorConfig: {
          ...this.defaultEditorConfig,
          mode: editorModalPayload.editorConfig.mode
        }
      }))
    );
  }

  public close() {
    this.uiService.closeModal('editor');
  }
}
