import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { CharCode } from 'src/renderer/app/enums/charcode.enum';
import { BuildFullPath } from 'src/renderer/app/libs/utils.lib';
import {
  Commands,
  ScoreAndPositions
} from 'src/renderer/app/models/command-palette.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { clearLogsAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private scoreCache: { [key: string]: ScoreAndPositions } = {};

  constructor(
    private environmentsService: EnvironmentsService,
    private uiService: UIService,
    private store: Store,
    private eventsService: EventsService
  ) {}

  public filterEntries(search$: Observable<string>) {
    return search$.pipe(
      map((search) =>
        search.length < 1
          ? this.generateCommands()
          : this.generateCommands().map((command) => {
              const cacheKey = `${command.label}-${search}`;
              let scoreAndPos: ScoreAndPositions;

              if (this.scoreCache[cacheKey]) {
                scoreAndPos = this.scoreCache[cacheKey];
              } else {
                scoreAndPos = this.scoreFuzzy(search, command.label);
                this.scoreCache[cacheKey] = scoreAndPos;
              }

              if (Array.isArray(scoreAndPos)) {
                return {
                  ...command,
                  labelDelimited: this.highlightMatches(
                    command.label,
                    scoreAndPos[1]
                  ),
                  score: scoreAndPos[0]
                };
              }

              // if it's not an array there is only a score and no positions
              return {
                ...command,
                score: scoreAndPos
              };
            })
      ),
      map((scoredCommands) =>
        scoredCommands
          .filter((command) => command.score > 0 && command.enabled)
          .sort((a, b) => b.score - a.score)
      )
    );
  }

  public executeCommand(commandId: string) {
    this.uiService.closeModal('commandPalette');

    const command = this.generateCommands().find((c) => c.id === commandId);

    if (command) {
      command.action();
    }
  }

  private ctrlOrCmd$(shortcuts: string[]) {
    return from(MainAPI.invoke('APP_GET_OS')).pipe(
      map(
        (os) =>
          `<kbd>${os === 'darwin' ? 'Cmd' : 'Ctrl'}</kbd>${shortcuts.reduce(
            (html, shortcut) => `${html}+<kbd>${shortcut}</kbd>`,
            ''
          )}`
      )
    );
  }

  /**
   * Fuzzy search and sort scores.
   * Inspired from https://github.com/microsoft/vscode/blob/main/src/vs/base/common/fuzzyScorer.ts
   * MIT license https://github.com/microsoft/vscode/blob/main/LICENSE.txt
   *
   * @param query
   * @param target
   * @returns
   */
  private scoreFuzzy(query: string, target: string): ScoreAndPositions {
    if (!target || !query) {
      return 0;
    }

    const targetLength = target.length;
    const queryLength = query.length;
    const queryLower = query.toLowerCase();
    const targetLower = target.toLowerCase();

    if (targetLength < queryLength) {
      return 0;
    }

    const scores: number[] = [];
    const matches: number[] = [];

    for (let queryIndex = 0; queryIndex < queryLength; queryIndex++) {
      const queryIndexOffset = queryIndex * targetLength;
      const queryIndexPreviousOffset = queryIndexOffset - targetLength;

      const queryIndexGtNull = queryIndex > 0;

      const queryCharAtIndex = query[queryIndex];
      const queryLowerCharAtIndex = queryLower[queryIndex];

      for (let targetIndex = 0; targetIndex < targetLength; targetIndex++) {
        const targetIndexGtNull = targetIndex > 0;

        const currentIndex = queryIndexOffset + targetIndex;
        const leftIndex = currentIndex - 1;
        const diagIndex = queryIndexPreviousOffset + targetIndex - 1;

        const leftScore = targetIndexGtNull ? scores[leftIndex] : 0;
        const diagScore =
          queryIndexGtNull && targetIndexGtNull ? scores[diagIndex] : 0;

        const matchesSequenceLength =
          queryIndexGtNull && targetIndexGtNull ? matches[diagIndex] : 0;

        let score: number;
        if (!diagScore && queryIndexGtNull) {
          score = 0;
        } else {
          score = this.computeCharScore(
            queryCharAtIndex,
            queryLowerCharAtIndex,
            target,
            targetLower,
            targetIndex,
            matchesSequenceLength
          );
        }

        const isValidScore = score && diagScore + score >= leftScore;

        if (isValidScore) {
          matches[currentIndex] = matchesSequenceLength + 1;
          scores[currentIndex] = diagScore + score;
        } else {
          matches[currentIndex] = 0;
          scores[currentIndex] = leftScore;
        }
      }
    }

    const positions: number[] = [];
    let queryIndexFinal = queryLength - 1;
    let targetIndexFinal = targetLength - 1;
    while (queryIndexFinal >= 0 && targetIndexFinal >= 0) {
      const currentIndex = queryIndexFinal * targetLength + targetIndexFinal;
      const match = matches[currentIndex];
      if (match === 0) {
        targetIndexFinal--;
      } else {
        positions.push(targetIndexFinal);

        queryIndexFinal--;
        targetIndexFinal--;
      }
    }

    return [scores[queryLength * targetLength - 1], positions.reverse()];
  }

  private computeCharScore(
    queryCharAtIndex: string,
    queryLowerCharAtIndex: string,
    target: string,
    targetLower: string,
    targetIndex: number,
    matchesSequenceLength: number
  ): number {
    let score = 0;

    if (
      !this.considerAsEqual(queryLowerCharAtIndex, targetLower[targetIndex])
    ) {
      return score;
    }

    score += 1;

    if (matchesSequenceLength > 0) {
      score += matchesSequenceLength * 5;
    }

    if (queryCharAtIndex === target[targetIndex]) {
      score += 1;
    }

    if (targetIndex === 0) {
      score += 8;
    } else {
      const separatorBonus = this.scoreSeparatorAtPos(
        target.charCodeAt(targetIndex - 1)
      );
      if (separatorBonus) {
        score += separatorBonus;
      } else if (
        CharCode.A <= target.charCodeAt(targetIndex) &&
        target.charCodeAt(targetIndex) <= CharCode.Z &&
        matchesSequenceLength === 0
      ) {
        score += 2;
      }
    }

    return score;
  }

  private scoreSeparatorAtPos(charCode: number): number {
    switch (charCode) {
      case CharCode.Slash:
      case CharCode.Backslash:
        return 5;
      case CharCode.Underline:
      case CharCode.Dash:
      case CharCode.Period:
      case CharCode.Space:
      case CharCode.SingleQuote:
      case CharCode.DoubleQuote:
      case CharCode.Colon:
        return 4;
      default:
        return 0;
    }
  }

  private considerAsEqual(a: string, b: string): boolean {
    if (a === b) {
      return true;
    }

    if (a === '/' || a === '\\') {
      return b === '/' || b === '\\';
    }

    return false;
  }

  private highlightMatches(text: string, positions: number[]) {
    let highlightedText = '';
    let previousPart = text;

    positions.forEach((position, positionIndex) => {
      const splitAtPos = text.slice(
        positions[positionIndex - 1] !== undefined
          ? positions[positionIndex - 1] + 1
          : 0,
        position + 1
      );

      highlightedText +=
        splitAtPos.substring(0, splitAtPos.length - 1) +
        '<span class="text-primary fw-bold">' +
        splitAtPos.charAt(splitAtPos.length - 1) +
        '</span>';

      previousPart = text.slice(position + 1);

      if (positionIndex === positions.length - 1) {
        highlightedText += previousPart;
      }
    });

    return highlightedText;
  }

  private generateCommands(): Commands {
    const hasAtLeastOneEnvironment = this.store.get('environments').length > 0;
    const hasMoreThanOneEnvironment = this.store.get('environments').length > 1;
    const hasActiveEnvironment = !!this.store.getActiveEnvironment();
    const hasActiveRoute = !!this.store.getActiveRoute();
    const activeEnvironment = this.store.getActiveEnvironment();
    const activeEnvironmentUuid = activeEnvironment?.uuid;
    const activeRoute = this.store.getActiveRoute();
    const activeRouteUuid = activeRoute?.uuid;
    const activeDatabucket = this.store.getActiveDatabucket();
    const hasActiveDatabucket = !!activeDatabucket;
    const activeDatabucketUuid = activeDatabucket?.uuid;
    const activeCallback = this.store.getActiveCallback();
    const hasActiveCallback = !!activeCallback;
    const activeCallbackUuid = activeCallback?.uuid;
    const environmentDescriptors = this.store.get('settings').environments;

    const commonCommands: Commands = [
      {
        id: 'VIEW_SELECT_PREVIOUS_ENVIRONMENT',
        label: 'Select Previous Environment',
        shortcut$: this.ctrlOrCmd$(['Up']),
        action: () => {
          this.environmentsService.setActiveEnvironment('previous');
        },
        score: 1,
        enabled: hasActiveEnvironment && hasMoreThanOneEnvironment
      },
      {
        id: 'VIEW_SELECT_NEXT_ENVIRONMENT',
        label: 'Select Next Environment',
        shortcut$: this.ctrlOrCmd$(['Down']),
        action: () => {
          this.environmentsService.setActiveEnvironment('next');
        },
        score: 1,
        enabled: hasActiveEnvironment && hasMoreThanOneEnvironment
      },
      {
        id: 'VIEW_NAVIGATE_ENVIRONMENT_ROUTES',
        label: 'Navigate to the Environment Routes',
        action: () => {
          this.environmentsService.setActiveView('ENV_ROUTES');
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'VIEW_NAVIGATE_ENVIRONMENT_DATA_BUCKETS',
        label: 'Navigate to the Environment Data buckets',
        action: () => {
          this.environmentsService.setActiveView('ENV_DATABUCKETS');
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'VIEW_NAVIGATE_ENVIRONMENT_HEADERS',
        label: 'Navigate to the Environment Headers',
        action: () => {
          this.environmentsService.setActiveView('ENV_HEADERS');
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'VIEW_NAVIGATE_ENVIRONMENT_CALLBACKS',
        label: 'Navigate to the Environment Callbacks',
        action: () => {
          this.environmentsService.setActiveView('ENV_CALLBACKS');
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'VIEW_NAVIGATE_ENVIRONMENT_LOGS',
        label: 'Navigate to the Environment Logs',
        action: () => {
          this.environmentsService.setActiveView('ENV_LOGS');
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'VIEW_NAVIGATE_ENVIRONMENT_PROXY',
        label: 'Navigate to the Environment Proxy Parameters',
        action: () => {
          this.environmentsService.setActiveView('ENV_PROXY');
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'VIEW_NAVIGATE_ENVIRONMENT_SETTINGS',
        label: 'Navigate to the Environment Settings',
        action: () => {
          this.environmentsService.setActiveView('ENV_SETTINGS');
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'VIEW_NAVIGATE_ROUTE_RESPONSE_BODY',
        label: 'Navigate to the Route Response Status And Body',
        action: () => {
          this.environmentsService.setActiveView('ENV_ROUTES');
          this.environmentsService.setActiveTab('RESPONSE');
        },
        score: 1,
        enabled: hasActiveEnvironment && hasActiveRoute
      },
      {
        id: 'VIEW_NAVIGATE_ROUTE_RESPONSE_DATA',
        label: 'Navigate to the Route Response Data',
        action: () => {
          this.environmentsService.setActiveView('ENV_ROUTES');
          this.environmentsService.setActiveTab('RESPONSE');
        },
        score: 1,
        enabled: hasActiveEnvironment && hasActiveRoute
      },
      {
        id: 'VIEW_NAVIGATE_ROUTE_RESPONSE_HEADERS',
        label: 'Navigate to the Route Response Headers',
        action: () => {
          this.environmentsService.setActiveView('ENV_ROUTES');
          this.environmentsService.setActiveTab('HEADERS');
        },
        score: 1,
        enabled: hasActiveEnvironment && hasActiveRoute
      },
      {
        id: 'VIEW_NAVIGATE_ROUTE_RESPONSE_RULES',
        label: 'Navigate to the Route Response Rules',
        action: () => {
          this.environmentsService.setActiveView('ENV_ROUTES');
          this.environmentsService.setActiveTab('RULES');
        },
        score: 1,
        enabled: hasActiveEnvironment && hasActiveRoute
      },
      {
        id: 'VIEW_NAVIGATE_ROUTE_RESPONSE_SETTINGS',
        label: 'Navigate to the Route Response Settings',
        action: () => {
          this.environmentsService.setActiveView('ENV_ROUTES');
          this.environmentsService.setActiveTab('SETTINGS');
        },
        score: 1,
        enabled: hasActiveEnvironment && hasActiveRoute
      },
      {
        id: 'VIEW_ZOOM_IN',
        label: 'Zoom in',
        shortcut$: this.ctrlOrCmd$(['+']),
        action: () => {
          MainAPI.send('APP_ZOOM', 'IN');
        },
        score: 1,
        enabled: true
      },
      {
        id: 'VIEW_ZOOM_OUT',
        label: 'Zoom out',
        shortcut$: this.ctrlOrCmd$(['-']),
        action: () => {
          MainAPI.send('APP_ZOOM', 'OUT');
        },
        score: 1,
        enabled: true
      },
      {
        id: 'VIEW_ZOOM_RESET',
        label: 'Reset zoom',
        shortcut$: this.ctrlOrCmd$(['0']),
        action: () => {
          MainAPI.send('APP_ZOOM', 'RESET');
        },
        score: 1,
        enabled: true
      },
      {
        id: 'RUN_START_ENVIRONMENT_CURRENT',
        label: 'Start/Stop/Reload Current Environment',
        shortcut$: this.ctrlOrCmd$(['Shift', 'S']),
        action: () => {
          this.environmentsService.toggleEnvironment();
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'RUN_START_ENVIRONMENT_ALL',
        label: 'Start/Stop/Reload All Environments',
        shortcut$: this.ctrlOrCmd$(['Shift', 'A']),
        action: () => {
          this.environmentsService.toggleAllEnvironments();
        },
        score: 1,
        enabled: hasAtLeastOneEnvironment
      },
      {
        id: 'OPEN_SETTINGS',
        label: 'Open Application Settings',
        shortcut$: this.ctrlOrCmd$([',']),
        action: () => {
          this.uiService.openModal('settings');
        },
        score: 1,
        enabled: true
      },
      {
        id: 'OPEN_APP_DATA_FOLDER',
        label: 'Open Application Data Folder',
        action: () => {
          MainAPI.send('APP_SHOW_FOLDER', 'userData');
        },
        score: 1,
        enabled: true
      },
      {
        id: 'OPEN_LOGS_FOLDER',
        label: 'Open Application Logs Folder',
        action: () => {
          MainAPI.send('APP_SHOW_FOLDER', 'logs');
        },
        score: 1,
        enabled: true
      },
      {
        id: 'NEW_ENVIRONMENT',
        label: 'Create a New Local Environment',
        shortcut$: this.ctrlOrCmd$(['N']),
        action: () => {
          this.environmentsService.addEnvironment().subscribe();
        },
        score: 1,
        enabled: true
      },
      {
        id: 'NEW_ENVIRONMENT_CLIPBOARD',
        label: 'Create a New Local Environment From Clipboard',
        action: () => {
          this.environmentsService.newEnvironmentFromClipboard().subscribe();
        },
        score: 1,
        enabled: true
      },
      {
        id: 'OPEN_ENVIRONMENT',
        label: 'Open Local Environment',
        shortcut$: this.ctrlOrCmd$(['O']),
        action: () => {
          this.environmentsService.openEnvironment().subscribe();
        },
        score: 1,
        enabled: true
      },
      {
        id: 'DUPLICATE_ENVIRONMENT',
        label: 'Duplicate Current Environment to Local',
        shortcut$: this.ctrlOrCmd$(['D']),
        action: () => {
          this.environmentsService.duplicateEnvironment().subscribe();
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'CLOSE_ENVIRONMENT',
        label: 'Close Current Environment',
        shortcut$: this.ctrlOrCmd$(['F4']),
        action: () => {
          this.environmentsService.closeEnvironment().subscribe();
        },
        score: 1,
        enabled:
          hasActiveEnvironment &&
          environmentDescriptors.find(
            (descriptor) =>
              descriptor.uuid === activeEnvironment.uuid &&
              descriptor.cloud === false
          ) !== undefined
      },
      {
        id: 'COPY_ENVIRONMENT_CLIPBOARD',
        label: 'Copy Current Environment Configuration to Clipboard',
        action: () => {
          this.environmentsService.copyEnvironmentToClipboard(
            activeEnvironmentUuid
          );
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'SHOW_ENVIRONMENT_FILE_EXPLORER',
        label: 'Show Current Environment Data File in Explorer/Finder',
        action: () => {
          this.environmentsService.showEnvironmentFileInFolder(
            activeEnvironmentUuid
          );
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'CREATE_DATA_BUCKET',
        label: 'Create a New Data Bucket',
        action: () => {
          this.environmentsService.setActiveView('ENV_DATABUCKETS');
          this.environmentsService.addDatabucket();
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'DUPLICATE_DATA_BUCKET',
        label: 'Duplicate Current Data Bucket',
        action: () => {
          this.environmentsService.duplicateDatabucket(activeDatabucketUuid);
        },
        score: 1,
        enabled: hasActiveEnvironment && hasActiveDatabucket
      },
      {
        id: 'DUPLICATE_DATA_BUCKET_TO_ENVIRONMENT',
        label: 'Duplicate Current Data Bucket to Another Environment',
        action: () => {
          this.environmentsService.startEntityDuplicationToAnotherEnvironment(
            activeDatabucketUuid,
            'databucket'
          );
        },
        score: 1,
        enabled:
          hasActiveEnvironment &&
          hasActiveDatabucket &&
          hasMoreThanOneEnvironment
      },
      {
        id: 'COPY_DATA_BUCKET_ID_CLIPBOARD',
        label: 'Copy Current Data Bucket Id to Clipboard',
        action: () => {
          MainAPI.send('APP_WRITE_CLIPBOARD', activeDatabucket.id);
        },
        score: 1,
        enabled: hasActiveEnvironment && hasActiveDatabucket
      },
      {
        id: 'CREATE_CALLBACK',
        label: 'Create a New Callback',
        action: () => {
          this.environmentsService.setActiveView('ENV_CALLBACKS');
          this.environmentsService.addCallback();
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'DUPLICATE_CALLBACK',
        label: 'Duplicate Current Callback',
        action: () => {
          this.environmentsService.duplicateCallback(activeCallbackUuid);
        },
        score: 1,
        enabled: hasActiveEnvironment && hasActiveCallback
      },
      {
        id: 'DUPLICATE_CALLBACK_TO_ENVIRONMENT',
        label: 'Duplicate Current Callback to Another Environment',
        action: () => {
          this.environmentsService.startEntityDuplicationToAnotherEnvironment(
            activeCallbackUuid,
            'callback'
          );
        },
        score: 1,
        enabled:
          hasActiveEnvironment && hasActiveCallback && hasMoreThanOneEnvironment
      },
      {
        id: 'CREATE_HTTP_ROUTE',
        label: 'Create a New HTTP Route',
        shortcut$: this.ctrlOrCmd$(['Shift', 'R']),
        action: () => {
          this.environmentsService.setActiveView('ENV_ROUTES');
          this.environmentsService.addHTTPRoute('root');
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'CREATE_CRUD_ROUTE',
        label: 'Create a New CRUD Route',
        action: () => {
          this.environmentsService.setActiveView('ENV_ROUTES');
          this.environmentsService.addCRUDRoute('root');
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'CREATE_FOLDER',
        label: 'Create a New Route Folder',
        action: () => {
          this.environmentsService.setActiveView('ENV_ROUTES');
          this.environmentsService.addFolder('root');
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'OPEN_TEMPLATES',
        label: 'Open Templates Dialog',
        action: () => {
          this.uiService.openModal('templates');
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'ENVIRONMENT_TOGGLE_RECORDING',
        label: 'Toggle Recording for Current Environment',
        action: () => {
          if (this.environmentsService.isRecording(activeEnvironmentUuid)) {
            this.environmentsService.stopRecording(activeEnvironmentUuid);

            return;
          }

          this.environmentsService.startRecording(activeEnvironmentUuid);
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'ENVIRONMENT_CLEAR_LOGS',
        label: 'Clear Logs for Current Environment',
        action: () => {
          this.store.update(clearLogsAction(activeEnvironmentUuid));
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'COPY_ROUTE_CLIPBOARD',
        label: 'Copy Current Route Configuration to Clipboard',
        action: () => {
          this.environmentsService.copyRouteToClipboard(activeRouteUuid);
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'COPY_ROUTE_FULL_PATH',
        label: 'Copy Current Route Full Path to Clipboard',
        action: () => {
          MainAPI.send(
            'APP_WRITE_CLIPBOARD',
            BuildFullPath(activeEnvironment, activeRoute)
          );
        },
        score: 1,
        enabled: hasActiveEnvironment
      },
      {
        id: 'DUPLICATE_ROUTE_TO_ENVIRONMENT',
        label: 'Duplicate Current Route to Another Environment',
        action: () => {
          this.environmentsService.startEntityDuplicationToAnotherEnvironment(
            activeRouteUuid,
            'route'
          );
        },
        score: 1,
        enabled:
          hasActiveEnvironment && hasActiveRoute && hasMoreThanOneEnvironment
      },
      {
        id: 'TOGGLE_ROUTE',
        label: 'Toggle Current Route (Enable/Disable)',
        action: () => {
          this.environmentsService.toggleRoute(activeRouteUuid);
        },
        score: 1,
        enabled: hasActiveEnvironment && hasActiveRoute
      },
      {
        id: 'CREATE_ROUTE_RESPONSE',
        label: 'Create Route Response for Current Route',
        action: () => {
          this.environmentsService.addRouteResponse();
        },
        score: 1,
        enabled: hasActiveEnvironment && hasActiveRoute
      },
      {
        id: 'ADD_ROUTE_HEADER',
        label: 'Add Header for Current Route',
        action: () => {
          this.environmentsService.setActiveView('ENV_ROUTES');
          this.environmentsService.setActiveTab('HEADERS');
          this.environmentsService.addRouteResponseHeader();
        },
        score: 1,
        enabled: hasActiveEnvironment && hasActiveRoute
      },
      {
        id: 'ADD_ENVIRONMENT_HEADER',
        label: 'Add Header for Current Environment',
        action: () => {
          this.environmentsService.setActiveView('ENV_HEADERS');
          this.environmentsService.addEnvironmentHeader();
        },
        score: 1,
        enabled: hasActiveEnvironment
      },

      {
        id: 'ENVIRONMENT_TOGGLE_PROXY',
        label: 'Toggle Proxy for Current Environment',
        action: () => {
          this.environmentsService.updateActiveEnvironment(
            {
              proxyMode: !activeEnvironment.proxyMode
            },
            true
          );
        },
        score: 1,
        enabled: hasActiveEnvironment
      }
    ];

    const selectEnvironmentCommands: Commands = this.store
      .get('environments')
      .map((environment) => ({
        id: `SELECT_ENVIRONMENT_${environment.uuid}`,
        label: `Select Environment ${environment.name}`,
        action: () => {
          this.environmentsService.setActiveEnvironment(environment.uuid);
        },
        score: 1,
        enabled: hasActiveEnvironment
      }));

    const selectRouteCommands: Commands =
      this.store.getActiveEnvironment()?.routes.map((route) => ({
        id: `SELECT_ROUTE_${route.uuid}`,
        label: `Select ${route.type === 'http' ? 'HTTP' : 'CRUD'} Route ${
          route.method === 'all' ? '' : route.method.toUpperCase()
        } /${route.endpoint}`,
        action: () => {
          this.environmentsService.setActiveView('ENV_ROUTES');
          this.environmentsService.setActiveRoute(route.uuid);
        },
        score: 1,
        enabled: hasActiveEnvironment
      })) || [];

    const selectDatabucketCommands: Commands =
      this.store.getActiveEnvironment()?.data.map((databucket) => ({
        id: `SELECT_DATA_BUCKET_${databucket.uuid}`,
        label: `Select Data Bucket ${databucket.name} (Id: ${databucket.id})`,
        action: () => {
          this.environmentsService.setActiveView('ENV_DATABUCKETS');
          this.environmentsService.setActiveDatabucket(databucket.uuid);
        },
        score: 1,
        enabled: hasActiveEnvironment
      })) || [];

    return [
      ...commonCommands,
      ...selectEnvironmentCommands,
      ...selectRouteCommands,
      ...selectDatabucketCommands
    ].sort((commandA, commandB) => {
      if (commandA.label > commandB.label) {
        return 1;
      }

      if (commandA.label < commandB.label) {
        return -1;
      }

      return 0;
    });
  }
}
