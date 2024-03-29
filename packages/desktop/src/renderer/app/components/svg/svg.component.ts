import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input
} from '@angular/core';

/**
 * Simple SVG component (KISS!)
 * - we don't have that many icons
 * - we don't want to add many dependencies (svg-to-ts, etc)
 * - using an SVG sprite can cause some UI flickering when change detection is triggered
 * - icon font was increasing the loading time and icons were invisible for some seconds (or displaying the icon name instead)
 *
 * Add a new icon:
 * - download the SVG from https://fonts.google.com/icons?selected=Material+Icons
 * - copy the svg content and add it to the html template with a ngSwitchCase
 * - add the new name to the type below
 *
 */
@Component({
  selector: 'app-svg',
  templateUrl: './svg.component.html',
  styleUrls: ['./svg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SvgComponent {
  @Input()
  @HostBinding('style.font-size.px')
  @HostBinding('style.line-height.px')
  public size = '16';
  @Input()
  public icon:
    | 'list'
    | 'record'
    | 'dots'
    | 'magic'
    | 'spinner'
    | 'account'
    | 'people'
    | 'endpoint'
    | 'endpoints'
    | 'play_arrow'
    | 'power'
    | 'power_settings_new'
    | 'refresh'
    | 'repeat'
    | 'save'
    | 'security'
    | 'settings'
    | 'show_chart'
    | 'shuffle'
    | 'speaker_notes'
    | 'stop'
    | 'storage'
    | 'subject'
    | 'unfold_less'
    | 'unfold_more'
    | 'update'
    | 'warning'
    | 'web_asset'
    | 'access_time'
    | 'add_box'
    | 'assignment'
    | 'call_made'
    | 'call_received'
    | 'check'
    | 'clear'
    | 'close'
    | 'code'
    | 'content_copy'
    | 'control_point_duplicate'
    | 'delete'
    | 'drag_indicator'
    | 'error'
    | 'featured_play_list'
    | 'find_in_page'
    | 'flag'
    | 'outlined_flag'
    | 'note_add'
    | 'folder'
    | 'folder_open'
    | 'folder_move'
    | 'history'
    | 'https'
    | 'info'
    | 'input'
    | 'insert_drive_file'
    | 'multiple_stop'
    | 'open_in_new'
    | 'priority_high'
    | 'data'
    | 'low_priority'
    | 'command_palette'
    | 'chevron_left'
    | 'chevron_right'
    | 'cloud'
    | 'cloud_off'
    | 'cloud_add'
    | 'cloud_remove'
    | 'computer'
    | string;

  constructor() {}
}
