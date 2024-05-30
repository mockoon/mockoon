import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  DataBucket,
  Environment,
  ReorderAction,
  ReorderableContainers
} from '@mockoon/commons';
import { Observable } from 'rxjs';
import {
  combineLatestWith,
  distinctUntilChanged,
  filter,
  map
} from 'rxjs/operators';
import { DropdownMenuComponent } from 'src/renderer/app/components/dropdown-menu/dropdown-menu.component';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { textFilter, trackByUuid } from 'src/renderer/app/libs/utils.lib';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { Settings } from 'src/shared/models/settings.model';

type dropdownMenuPayload = { databucketUuid: string };

@Component({
  selector: 'app-databuckets-menu',
  templateUrl: './databuckets-menu.component.html',
  styleUrls: ['./databuckets-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatabucketsMenuComponent implements OnInit {
  public settings$: Observable<Settings>;
  public activeEnvironment$: Observable<Environment>;
  public databucketList$: Observable<DataBucket[]>;
  public activeDatabucket$: Observable<DataBucket>;
  public databucketsFilter$: Observable<string>;
  public focusableInputs = FocusableInputs;
  public menuSize = Config.defaultSecondaryMenuSize;
  public trackByUuid = trackByUuid;
  public dropdownMenuItems: DropdownMenuComponent['items'] = [
    {
      label: 'Duplicate',
      icon: 'content_copy',
      twoSteps: false,
      action: ({ databucketUuid }: dropdownMenuPayload) => {
        this.environmentsService.duplicateDatabucket(databucketUuid);
      }
    },
    {
      label: 'Duplicate to environment',
      icon: 'input',
      twoSteps: false,
      disabled$: () =>
        this.store
          .select('environments')
          .pipe(map((environments) => environments.length < 2)),
      action: ({ databucketUuid }: dropdownMenuPayload) => {
        this.environmentsService.startEntityDuplicationToAnotherEnvironment(
          databucketUuid,
          'databucket'
        );
      }
    },
    {
      label: 'Copy ID to clipboard',
      icon: 'assignment',
      twoSteps: false,
      action: ({ databucketUuid }: dropdownMenuPayload) => {
        const databucket = this.store.getDatabucketByUUID(databucketUuid);

        MainAPI.send('APP_WRITE_CLIPBOARD', databucket.id);
      }
    },
    {
      label: 'Delete',
      icon: 'delete',
      twoSteps: true,
      confirmIcon: 'error',
      confirmLabel: 'Confirm deletion',
      action: ({ databucketUuid }: dropdownMenuPayload) => {
        this.environmentsService.removeDatabucket(databucketUuid);
      }
    }
  ];

  constructor(
    private environmentsService: EnvironmentsService,
    private store: Store
  ) {}

  ngOnInit() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.activeDatabucket$ = this.store.selectActiveDatabucket();
    this.settings$ = this.store.select('settings');
    this.databucketsFilter$ = this.store.selectFilter('databuckets');

    this.databucketList$ = this.store.selectActiveEnvironment().pipe(
      filter((activeEnvironment) => !!activeEnvironment),
      distinctUntilChanged(),
      combineLatestWith(this.databucketsFilter$),
      map(([activeEnvironment, search]) =>
        !search
          ? activeEnvironment.data
          : activeEnvironment.data.filter((databucket) =>
              textFilter(
                `${databucket.name} ${databucket.documentation}`,
                search
              )
            )
      )
    );
  }

  /**
   * Callback called when reordering databuckets
   *
   * @param reorderAction
   */
  public reorganizeDatabuckets(reorderAction: ReorderAction) {
    this.environmentsService.reorderItems(
      reorderAction as ReorderAction<string>,
      ReorderableContainers.DATABUCKETS
    );
  }

  /**
   * Create a new databucket in the current environment. Append at the end of the list
   */
  public addDatabucket() {
    this.environmentsService.addDatabucket();
  }

  /**
   * Select a databucket by UUID, or the first databucket if no UUID is present
   */
  public selectDatabucket(databucketUUID: string) {
    this.environmentsService.setActiveDatabucket(databucketUUID);
  }
}
