import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EditorModalData } from 'src/renderer/app/models/editor.model';
import { EventsService } from 'src/renderer/app/services/events.service';

@Component({
  selector: 'app-editor-modal',
  templateUrl: './editor-modal.component.html',
  styleUrls: ['editor-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditorModalComponent implements OnInit, AfterViewInit {
  @ViewChild('modal')
  public modal: ElementRef;
  public data$ = new BehaviorSubject<EditorModalData>(null);
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
    private modalService: NgbModal,
    private eventsService: EventsService
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.eventsService.editorModalEvents
      .pipe(
        tap((editorModalEvent) => {
          this.modalService
            .open(this.modal, {
              backdrop: 'static',
              centered: true,
              size: 'lg'
            })
            .result.then(
              () => {},
              () => {}
            );

          this.data$.next({
            content: editorModalEvent.content,
            title: editorModalEvent.title,
            editorConfig: {
              ...this.defaultEditorConfig,
              mode: editorModalEvent.mode
            }
          });
        })
      )
      .subscribe();
  }
}
