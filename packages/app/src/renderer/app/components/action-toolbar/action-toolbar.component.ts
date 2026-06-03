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
  private confirmRequested$ = new TimedBoolean();
  public readonly count = input.required<number>();
  public readonly selectedLabel = input('selected');
  public readonly ariaLabel = input('Actions');
  public readonly buttons = input.required<ToolbarButtonConfig[]>();
  public readonly buttonClicked = output<string>();

  public isConfirming(button: ToolbarButtonConfig): boolean {
    const state = this.confirmRequested$.getValue();

    return state.enabled && state.payload === button.id;
  }

  public getButtonIcon(button: ToolbarButtonConfig): SvgComponent['icon'] {
    return this.isConfirming(button)
      ? button.confirmIcon || 'error'
      : button.icon;
  }

  public getButtonAriaLabel(button: ToolbarButtonConfig): string {
    return this.isConfirming(button)
      ? button.confirmAriaLabel || `Confirm ${button.ariaLabel.toLowerCase()}`
      : button.ariaLabel;
  }

  public getButtonTooltip(button: ToolbarButtonConfig): string {
    return this.isConfirming(button)
      ? button.confirmTooltip || 'Click again to confirm'
      : button.tooltip;
  }

  public onButtonClick(button: ToolbarButtonConfig) {
    if (button.twoSteps && !this.isConfirming(button)) {
      this.confirmRequested$.readValue(button.id);

      return;
    }

    this.confirmRequested$.next({ enabled: false, payload: null });
    this.buttonClicked.emit(button.action);
  }
}
