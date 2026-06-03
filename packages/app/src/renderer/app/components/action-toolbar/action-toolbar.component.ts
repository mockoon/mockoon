import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TimedBoolean } from 'src/renderer/app/classes/timed-boolean';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { ToolbarButtonConfig } from 'src/renderer/app/models/ui.model';

@Component({
  selector: 'app-action-toolbar',
  templateUrl: './action-toolbar.component.html',
  styleUrls: ['./action-toolbar.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SvgComponent, NgbTooltip, AsyncPipe]
})
export class ActionToolbarComponent {
  public confirmRequested$ = new TimedBoolean();
  public readonly count = input.required<number>();
  public readonly selectedLabel = input('selected');
  public readonly ariaLabel = input('Actions');
  public readonly buttons = input.required<ToolbarButtonConfig[]>();
  public readonly buttonClicked = output<string>();

  public getButtonIcon(button: ToolbarButtonConfig): SvgComponent['icon'] {
    const confirmValue = this.confirmRequested$.getValue();

    return confirmValue.enabled && confirmValue.payload === button.id
      ? button.confirmIcon || 'error'
      : button.icon;
  }

  public getButtonAriaLabel(button: ToolbarButtonConfig): string {
    const confirmValue = this.confirmRequested$.getValue();

    return confirmValue.enabled && confirmValue.payload === button.id
      ? button.confirmAriaLabel || `Confirm ${button.ariaLabel.toLowerCase()}`
      : button.ariaLabel;
  }

  public getButtonTooltip(button: ToolbarButtonConfig): string {
    const confirmValue = this.confirmRequested$.getValue();

    return confirmValue.enabled && confirmValue.payload === button.id
      ? button.confirmTooltip || 'Click again to confirm'
      : button.tooltip;
  }

  public onButtonClick(button: ToolbarButtonConfig) {
    const confirmValue = this.confirmRequested$.getValue();

    if (
      button.twoSteps &&
      !(confirmValue.enabled && confirmValue.payload === button.id)
    ) {
      this.confirmRequested$.readValue(button.id);

      return;
    }

    this.confirmRequested$.next({ enabled: false, payload: null });
    this.buttonClicked.emit(button.action);
  }
}
