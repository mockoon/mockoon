import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { shell } from 'electron';
import { Config } from 'src/app/config';

/**
 * Heading and subheading can be passed through simple string inputs or
 * with transclusion when more complex content is needed.
 */
@Component({
  selector: 'app-title-separator',
  templateUrl: './title-separator.component.html',
  styleUrls: ['./title-separator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TitleSeparatorComponent implements OnInit {
  @Input() heading: string;
  @Input() subheading: string;
  @Input() isFirst = false;
  @Input() docLink: string;
  @Input() icon: string;
  @Input() iconClasses: string;
  @Input() iconClickable: boolean;
  @Input() iconTooltip: string;
  @Output() iconClicked = new EventEmitter<void>();

  constructor() {}

  ngOnInit() {}

  public linkClick() {
    shell.openExternal(Config.docs[this.docLink]);
  }

  public iconClick() {
    if (this.iconClickable) {
      this.iconClicked.emit();
    }
  }
}
