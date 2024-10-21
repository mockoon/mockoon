import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SyncPresence, SyncUserPresence, User } from '@mockoon/cloud';

/**
 * Display user presence bubbles.
 * - Complete list tooltip can be deactivated with showTooltipList input.
 * - maxDisplayedUsers input can be used to limit the number of displayed users.
 * - filterBy and filterContext can be used to filter the users displayed.
 * e.g. filterBy = 'environmentUuid' and filterContext = variable will only display userPresence with the property environmentUuid == variable.
 * Note: if filterBy is set, filterContext must be set too. Also, the filter is applied without taking into account the maxDisplayedUsers limit.
 */
@Component({
  selector: 'app-team-presence',
  templateUrl: './team-presence.component.html',
  styleUrls: ['./team-presence.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamPresenceComponent {
  @Input({ required: false })
  public displaySelf = true;
  @Input({ required: true })
  public user: User;
  @Input({ required: true })
  public presence: SyncPresence;
  @Input({ required: false })
  public maxDisplayedUsers = 5;
  @Input({ required: false })
  public filterBy: keyof SyncUserPresence = null;
  @Input({ required: false })
  public filterContext: string = null;
  @Input({ required: false })
  public size = '22';
  @Input({ required: false })
  public showTooltipList = true;
}
