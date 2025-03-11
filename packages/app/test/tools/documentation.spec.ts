import { BodyTypes } from '@mockoon/commons';
import { promises as fs } from 'fs';
import { ChainablePromiseElement } from 'webdriverio';
import callbacks from '../libs/callbacks';
import databuckets from '../libs/databuckets';
import environments from '../libs/environments';
import environmentsLogs from '../libs/environments-logs';
import environmentsProxy from '../libs/environments-proxy';
import environmentsSettings from '../libs/environments-settings';
import file from '../libs/file';
import headersUtils from '../libs/headers-utils';
import http from '../libs/http';
import modals from '../libs/modals';
import navigation from '../libs/navigation';
import routes, { RoutesMenuActions } from '../libs/routes';
import settings from '../libs/settings';
import utils, {
  DropdownMenuEnvironmentActions,
  DropdownMenuFolderActions,
  DropdownMenuLogsActions,
  DropdownMenuRouteActions
} from '../libs/utils';

/**
 * Spec file used to generate documentation screenshots
 */

type HighlightGaps = {
  top: number;
  right: number;
  left: number;
  // provide bottom or fromTop if element is huge
  bottom?: number;
  fromTop?: number;
};

type ScreenshotPosition = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

type ScreeenshotGaps = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

const clearElements = async () => {
  await driver.executeScript(
    ` document.querySelector('.highlight-element')?.remove();
     document.querySelector('.screenshot-element')?.remove();`,
    []
  );
};

const highlight = async (
  targetSelector: ChainablePromiseElement<WebdriverIO.Element>,
  highlightGaps: HighlightGaps
) => {
  const height =
    highlightGaps.fromTop !== undefined
      ? `${highlightGaps.fromTop} + ${highlightGaps.top}`
      : `targetPosition.height + ${highlightGaps.top} + ${highlightGaps.bottom}`;

  await driver.executeScript(
    ` const target = document.querySelector('${await targetSelector.selector}');
      const targetPosition = target.getBoundingClientRect();

      var element = document.createElement('div');
      element.classList.add('highlight-element')
      element.style.position="fixed";
      element.style.top=(targetPosition.top - ${highlightGaps.top}) + "px";
      element.style.left=(targetPosition.left - ${highlightGaps.left}) + "px";
      element.style.width=(targetPosition.width + ${highlightGaps.left} + ${
        highlightGaps.right
      }) + "px";
      element.style.height=(${height}) + "px";
      element.style.border="3px solid red";
      element.style.zIndex='10000';
      document.body.appendChild(element)`,
    []
  );
};

const takeElementScreenshot = async (
  targetSelector: ChainablePromiseElement<WebdriverIO.Element> | null,
  screeenshotPosition: ScreenshotPosition,
  screeenshotGaps: ScreeenshotGaps,
  folder: string,
  filePath: string
) => {
  await browser.pause(500);
  const position = `element.style.top=(${
    screeenshotPosition.top !== undefined
      ? screeenshotPosition.top
      : 'highlightedTargetPosition.top - ' + screeenshotGaps.top
  }) + "px";
  element.style.left=(${
    screeenshotPosition.left !== undefined
      ? screeenshotPosition.left
      : 'highlightedTargetPosition.left - ' + screeenshotGaps.left
  }) + "px";
  element.style.right= (${
    screeenshotPosition.right !== undefined
      ? screeenshotPosition.right
      : 'window.innerWidth - (highlightedTargetPosition.right + ' +
        screeenshotGaps.right +
        ')'
  }) + "px";
  element.style.bottom= (${
    screeenshotPosition.bottom !== undefined
      ? screeenshotPosition.bottom
      : 'window.innerHeight - (highlightedTargetPosition.bottom + ' +
        screeenshotGaps.bottom +
        ')'
  }) + "px";`;

  // if no target provided, use the highlight element created in the highlight function, if target is provided, use it
  const script = `let highlightedTarget; ${
    targetSelector !== null
      ? `highlightedTarget = document.querySelector('${await targetSelector.selector}');`
      : "highlightedTarget = document.querySelector('.highlight-element');"
  }
  const highlightedTargetPosition = highlightedTarget.getBoundingClientRect();

  var element = document.createElement('div');
  element.classList.add('screenshot-element');
  element.style.position="fixed";
  ${position}
  element.style.zIndex='10100';
  document.body.appendChild(element)`;

  await driver.executeScript(script, []);

  await $('.screenshot-element').saveScreenshot(
    `./tmp/docs/${folder}/${filePath}`
  );
};

/**
 * if no screenshot target use the highlighted
 * if no highlight element,
 * use the highlight target
 *
 */
const documentationTopics: {
  enabled: boolean;
  folder: string;
  screenshots: {
    // tasks to be performed before taking the screenshot
    tasks?: () => Promise<void>;
    // tasks to be performed after taking the screenshot
    postTasks?: () => Promise<void>;
    // provide screenshot target if different from highlighted element (has priority over highlighted element when taking the screenshot)
    screenshotTarget?: ChainablePromiseElement<WebdriverIO.Element>;
    highlightedTarget: ChainablePromiseElement<WebdriverIO.Element>;
    // highlight element with a red rectangle
    highlight: boolean;
    // optional gaps inside the red rectangle (padding) if `highlight` is false
    highlightGaps?: HighlightGaps;
    // screenshot absolute positionning
    screenshotPosition: ScreenshotPosition;
    // gaps (padding) around the red rectangle
    screeenshotGaps: ScreeenshotGaps;
    fileName: string;
  }[];
}[] = [
  {
    enabled: true,
    folder: 'server-configuration/port-prefix',
    screenshots: [
      {
        tasks: null,
        get highlightedTarget() {
          return navigation.settingsTab;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { left: 0, top: 0 },
        screeenshotGaps: { right: 50, bottom: 125 },
        fileName: 'open-environment-settings.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_SETTINGS');
        },
        get highlightedTarget() {
          return environmentsSettings.port;
        },
        highlight: true,
        highlightGaps: { top: 10, right: 10, bottom: 10, left: 10 },
        screenshotPosition: { top: 0, left: 0 },
        screeenshotGaps: { right: 250, bottom: 125 },
        fileName: 'environment-custom-port.png'
      },
      {
        tasks: null,
        get highlightedTarget() {
          return environmentsSettings.prefix;
        },
        highlight: true,
        highlightGaps: { top: 10, right: 10, bottom: 10, left: 10 },
        screenshotPosition: { top: 0, left: 0 },
        screeenshotGaps: { right: 250, bottom: 125 },
        fileName: 'environment-custom-prefix.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'api-endpoints/routing',
    screenshots: [
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
          await utils.dropdownMenuOpen(
            '.routes-menu .nav-item:nth-child(1) .nav-link'
          );
        },
        postTasks: async () => {
          await utils.dropdownMenuClose();
        },
        get screenshotTarget() {
          return utils.dropdownMenuGetItemRef(DropdownMenuRouteActions.TOGGLE);
        },
        get highlightedTarget() {
          return utils.dropdownMenuGetItemRef(DropdownMenuRouteActions.TOGGLE);
        },
        highlight: true,
        highlightGaps: { left: 5, right: 5, bottom: 5, top: 5 },
        screenshotPosition: { top: 0, left: 0 },
        screeenshotGaps: { right: 50, bottom: 50 },
        fileName: 'route-menu-disable-route.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
        },
        get highlightedTarget() {
          return navigation.settingsTab;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { left: 0, top: 0 },
        screeenshotGaps: { right: 50, bottom: 125 },
        fileName: 'open-environment-settings.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_SETTINGS');
        },
        get highlightedTarget() {
          return environmentsSettings.prefix;
        },
        highlight: true,
        highlightGaps: { top: 10, right: 10, bottom: 10, left: 10 },
        screenshotPosition: { top: 0, left: 0 },
        screeenshotGaps: { right: 250, bottom: 125 },
        fileName: 'environment-prefix.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
          await routes.select(2);
        },
        get highlightedTarget() {
          return routes.pathInput;
        },
        highlight: false,
        screenshotPosition: {},
        screeenshotGaps: { top: 20, right: 20, bottom: 20, left: 330 },
        fileName: 'route-patterns.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
          await routes.select(3);
        },
        get highlightedTarget() {
          return routes.pathInput;
        },
        highlight: false,
        screenshotPosition: {},
        screeenshotGaps: { top: 20, right: 20, bottom: 20, left: 330 },
        fileName: 'route-params.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'response-configuration/response-headers',
    screenshots: [
      {
        tasks: async () => {
          await routes.select(1);
          await routes.switchTab('HEADERS');
        },
        get highlightedTarget() {
          return headersUtils.getLine('route-response-headers', 1);
        },
        highlight: true,
        highlightGaps: { top: 10, right: 10, bottom: 10, left: 10 },
        screenshotPosition: { right: 0 },
        screeenshotGaps: { top: 100, bottom: 50, left: 30 },
        fileName: 'fill-route-header-form.png'
      },
      {
        tasks: async () => {
          await routes.select(1);
          await routes.switchTab('HEADERS');
        },
        get highlightedTarget() {
          return headersUtils.getAddButton('route-response-headers');
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { right: 0 },
        screeenshotGaps: { top: 150, bottom: 50, left: 20 },
        fileName: 'add-route-header.png'
      },
      {
        tasks: null,
        get highlightedTarget() {
          return navigation.headersTab;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { top: 0, left: 0 },
        screeenshotGaps: { right: 300, bottom: 125 },
        fileName: 'open-environment-headers.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_HEADERS');
          await headersUtils.add('environment-headers', {
            key: 'Content-Type',
            value: 'application/xml'
          });
        },
        get highlightedTarget() {
          return headersUtils.getAddButton('environment-headers');
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { top: 0, right: 0 },
        screeenshotGaps: { bottom: 20, left: 20 },
        fileName: 'add-environment-header.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'server-configuration/proxy-mode',
    screenshots: [
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
        },
        get highlightedTarget() {
          return navigation.proxyTab;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { top: 0, left: 0 },
        screeenshotGaps: { right: 250, bottom: 125 },
        fileName: 'open-proxy-options.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_PROXY');
          await environmentsProxy.toggleSetting('proxyMode');
          await environmentsProxy.setOptionValue(
            'proxyHost',
            'http://localhost:5555'
          );
        },
        get highlightedTarget() {
          return environmentsProxy.getOptionCheckbox('proxyMode');
        },
        highlight: true,
        highlightGaps: { top: 10, right: 350, bottom: 60, left: 30 },
        screenshotPosition: { top: 0, left: 0, right: 0 },
        screeenshotGaps: { bottom: 150 },
        fileName: 'enable-proxy.png'
      },
      {
        tasks: async () => {
          await environmentsProxy.toggleSetting('proxyRemovePrefix');
        },
        get highlightedTarget() {
          return environmentsProxy.getOptionCheckbox('proxyRemovePrefix');
        },
        highlight: true,
        highlightGaps: { top: 10, right: 30, bottom: 10, left: 30 },
        screenshotPosition: { top: 0, left: 0 },
        screeenshotGaps: { bottom: 150, right: 450 },
        fileName: 'proxy-no-forward.png'
      },
      {
        tasks: async () => {
          await headersUtils.add('env-proxy-req-headers', {
            key: 'forward-to-proxy',
            value: 'value'
          });
          await headersUtils.add('env-proxy-res-headers', {
            key: 'add-to-proxy-res',
            value: 'value'
          });
        },
        get highlightedTarget() {
          return environmentsProxy.headersContainer;
        },
        highlight: true,
        highlightGaps: { top: 10, right: 0, fromTop: 150, left: 10 },
        screenshotPosition: { top: 0, left: 0, right: 0 },
        screeenshotGaps: { bottom: 50 },
        fileName: 'proxy-headers.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'logging-and-recording/requests-logging',
    screenshots: [
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
        },
        get highlightedTarget() {
          return navigation.logsTab;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { top: 0, left: 0 },
        screeenshotGaps: { right: 250, bottom: 125 },
        fileName: 'open-logs.png'
      },
      {
        tasks: async () => {
          await environments.start();
          await http.assertCall({
            method: 'GET',
            path: '/users',
            body: '{\n  "id": "386a3756-cbae-4327-800d-56e0c2c6a094"\n}',
            headers: { 'Content-Type': 'application/json' }
          });
          await navigation.switchView('ENV_LOGS');
          await environmentsLogs.select(1);
        },
        get highlightedTarget() {
          return environmentsLogs.container;
        },
        highlight: false,
        screenshotPosition: { top: 0, right: 0 },
        screeenshotGaps: { left: 50, bottom: -300 },
        fileName: 'logs-request.png'
      },
      {
        tasks: async () => {
          await environmentsLogs.switchTab('RESPONSE');
        },
        get highlightedTarget() {
          return environmentsLogs.container;
        },
        highlight: false,
        screenshotPosition: { top: 0, right: 0 },
        screeenshotGaps: { left: 50, bottom: -300 },
        fileName: 'logs-response.png'
      },
      {
        tasks: async () => {
          await http.assertCall({
            method: 'GET',
            path: '/newroute'
          });
        },
        get screenshotTarget() {
          return environmentsLogs.container;
        },
        get highlightedTarget() {
          return environmentsLogs.getMetadataIcon(1);
        },
        highlight: true,
        highlightGaps: { left: 5, right: 5, bottom: 5, top: 5 },
        screenshotPosition: { top: 0, right: 0 },
        screeenshotGaps: { left: 50, bottom: -300 },
        fileName: 'logs-metadata.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'logging-and-recording/auto-mocking-and-recording',
    screenshots: [
      {
        tasks: async () => {
          await utils.dropdownMenuOpen(
            '.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(2) .nav-link'
          );
        },
        postTasks: async () => {
          await utils.dropdownMenuClose();
        },
        get screenshotTarget() {
          return environmentsLogs.container;
        },
        get highlightedTarget() {
          return utils.dropdownMenuGetItemRef(DropdownMenuLogsActions.MOCK);
        },
        highlight: true,
        highlightGaps: { left: 5, right: 5, bottom: 5, top: 5 },
        screenshotPosition: { top: 0, right: 0 },
        screeenshotGaps: { left: 50, bottom: -300 },
        fileName: 'logs-auto-mocking.png'
      },
      {
        tasks: async () => {},
        get screenshotTarget() {
          return environmentsLogs.container;
        },
        get highlightedTarget() {
          return environmentsLogs.startRecordingBtn;
        },

        highlight: true,
        highlightGaps: { left: 5, right: 5, bottom: 5, top: 5 },
        screenshotPosition: { top: 0, right: 0 },
        screeenshotGaps: { left: 50, bottom: -300 },
        fileName: 'logs-start-recording.png'
      },
      {
        tasks: async () => {
          await environmentsLogs.startRecording();
        },
        get screenshotTarget() {
          return environmentsLogs.container;
        },
        get highlightedTarget() {
          return environments.recordingIndicator;
        },
        highlight: true,
        highlightGaps: { left: 5, right: 5, bottom: 5, top: 5 },
        screenshotPosition: { left: 0, top: 0 },
        screeenshotGaps: { bottom: -500, right: -300 },
        fileName: 'logs-recording-in-progress.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'server-configuration/serving-over-tls',
    screenshots: [
      {
        tasks: async () => {
          await environmentsLogs.stopRecording();
          await navigation.switchView('ENV_ROUTES');
        },
        get highlightedTarget() {
          return navigation.settingsTab;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { top: 0, left: 0 },
        screeenshotGaps: { right: 270, bottom: 125 },
        fileName: 'open-environment-settings.png'
      },
      {
        tasks: async () => {
          await environments.stop();
          await navigation.switchView('ENV_SETTINGS');
          await environmentsSettings.toggleSetting('enabled');
        },
        get highlightedTarget() {
          return environmentsSettings.enableTLS;
        },
        highlight: true,
        highlightGaps: { top: 5, right: 10, bottom: 5, left: 30 },
        screenshotPosition: { top: 0, left: 0 },
        screeenshotGaps: { right: 600, bottom: 100 },
        fileName: 'enable-tls.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_SETTINGS');
        },
        get highlightedTarget() {
          return environmentsSettings.certContainer;
        },
        highlight: true,
        highlightGaps: { top: 5, right: 5, bottom: 5, left: 5 },
        screenshotPosition: { top: 0, left: 0, right: 0 },
        screeenshotGaps: { bottom: 300 },
        fileName: 'enable-tls-custom-certificate.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'server-configuration/cors',
    screenshots: [
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
        },
        get highlightedTarget() {
          return navigation.settingsTab;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { top: 0, left: 0 },
        screeenshotGaps: { right: 270, bottom: 125 },
        fileName: 'open-environment-settings.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_SETTINGS');
        },
        get highlightedTarget() {
          return environmentsSettings.preflight;
        },
        highlight: true,
        highlightGaps: { top: 5, right: 10, bottom: 5, left: 30 },
        screenshotPosition: { top: 0, left: 0 },
        screeenshotGaps: { right: 600, bottom: 30 },
        fileName: 'enable-cors.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
        },
        get highlightedTarget() {
          return navigation.headersTab;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { top: 0, left: 0, right: 0 },
        screeenshotGaps: { bottom: 125 },
        fileName: 'open-environment-headers.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_HEADERS');
        },
        get highlightedTarget() {
          return headersUtils.secondaryBtn;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { top: 0, left: 0, right: 0 },
        screeenshotGaps: { bottom: 20 },
        fileName: 'add-cors-headers.png'
      },
      {
        tasks: async () => {
          await headersUtils.clickCORSButton('environment-headers');
        },
        get highlightedTarget() {
          return headersUtils.getLine('environment-headers', 2);
        },
        highlight: true,
        highlightGaps: { top: 5, right: 5, bottom: 80, left: 5 },
        screenshotPosition: { top: 0, left: 0, right: 0 },
        screeenshotGaps: { bottom: 40 },
        fileName: 'view-cors-headers.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'server-configuration/listening-hostname',
    screenshots: [
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
        },
        get highlightedTarget() {
          return navigation.settingsTab;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { top: 0, left: 0 },
        screeenshotGaps: { right: 270, bottom: 125 },
        fileName: 'open-environment-settings.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_SETTINGS');
          await environmentsSettings.setSettingValue('hostname', '192.168.1.1');
        },
        get highlightedTarget() {
          return environmentsSettings.hostname;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { top: 0, left: 0, right: 0 },
        screeenshotGaps: { bottom: 50 },
        fileName: 'custom-hostname-setting.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'response-configuration/response-body',
    screenshots: [
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
          await routes.switchTab('RESPONSE');
        },
        get highlightedTarget() {
          return routes.bodyTypeToggle;
        },
        highlight: true,
        highlightGaps: { top: 5, right: 5, bottom: 5, left: 5 },
        screenshotPosition: { left: 0, right: 0, top: 0 },
        screeenshotGaps: { bottom: 150 },
        fileName: 'body-type-toggle.png'
      },
      {
        tasks: async () => {
          await routes.selectBodyType(BodyTypes.INLINE);
        },
        highlightedTarget: null,
        get screenshotTarget() {
          return routes.bodyTypeToggle;
        },
        highlight: false,
        // highlightGaps: { top: 5, right: 5, bottom: 5, left: 5 },
        screenshotPosition: { right: 0, bottom: 0 },
        screeenshotGaps: { top: 200, left: 600 },
        fileName: 'inline-body-editor.png'
      },
      {
        tasks: async () => {
          await routes.selectBodyType(BodyTypes.FILE);
        },
        highlightedTarget: null,
        get screenshotTarget() {
          return routes.bodyTypeToggle;
        },
        highlight: false,
        // highlightGaps: { top: 5, right: 5, bottom: 5, left: 5 },
        screenshotPosition: { right: 0, bottom: 0 },
        screeenshotGaps: { top: 200, left: 600 },
        fileName: 'body-file-serving.png'
      },
      {
        tasks: async () => {
          await routes.selectBodyType(BodyTypes.DATABUCKET);
        },
        highlightedTarget: null,
        get screenshotTarget() {
          return routes.bodyTypeToggle;
        },
        highlight: false,
        // highlightGaps: { top: 5, right: 5, bottom: 5, left: 5 },
        screenshotPosition: { right: 0, bottom: 0 },
        screeenshotGaps: { top: 200, left: 600 },
        fileName: 'body-data-bucket.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'response-configuration/file-serving',
    screenshots: [
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
          await routes.select(4);
        },
        get highlightedTarget() {
          return routes.fileInput;
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 10, right: 80, bottom: 60, left: 10 },
        screeenshotGaps: { top: 200, bottom: 50, left: 20 },
        fileName: 'file-path.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
          await utils.dropdownMenuOpen(
            `.environments-menu div:first-of-type .nav-item:nth-child(${1}) .nav-link`
          );
        },
        postTasks: async () => {
          await utils.dropdownMenuClose();
        },
        get highlightedTarget() {
          return utils.dropdownMenuGetItemRef(
            DropdownMenuEnvironmentActions.SHOW_FOLDER
          );
        },
        highlight: true,
        screenshotPosition: { top: 0, left: 0 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { right: 150, bottom: 150 },
        fileName: 'environment-show-in-folder.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
          await routes.switchTab('SETTINGS');
          await routes.toggleDisableTemplating();
        },
        get highlightedTarget() {
          return routes.disableTemplatingElement;
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 5, right: 30, bottom: 5, left: 30 },
        screeenshotGaps: { top: 100, bottom: 50, left: 100 },
        fileName: 'route-response-disable-templating.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
          await routes.switchTab('SETTINGS');
          await routes.toggleDisableTemplating();
          await routes.togglefallback404();
        },
        get highlightedTarget() {
          return routes.fallback404Element;
        },
        highlight: true,
        highlightGaps: { top: 5, right: 30, bottom: 5, left: 30 },
        screenshotPosition: { right: 0 },
        screeenshotGaps: { top: 150, bottom: 50, left: 100 },
        fileName: 'enable-404-fallback.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'route-responses/multiple-responses',
    screenshots: [
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
          await routes.switchTab('RESPONSE');
          await routes.select(1);
        },
        get highlightedTarget() {
          return routes.addResponseBtn;
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { top: 30, bottom: 100, left: 30 },
        fileName: 'add-route-response.png'
      },
      {
        tasks: async () => {},
        get highlightedTarget() {
          return routes.duplicateResponseBtn;
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { top: 60, bottom: 100, left: 1100 },
        fileName: 'duplicate-route-response.png'
      },
      {
        tasks: async () => {
          await routes.openRouteResponseMenu();
        },
        get highlightedTarget() {
          return routes.routeResponseDropdown;
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { top: 50, bottom: 100, left: 50 },
        fileName: 'reorder-responses.png'
      },
      {
        tasks: async () => {},
        get highlightedTarget() {
          return routes.getRouteResponseFlagBtn(1);
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 5, right: 10, bottom: 40, left: 10 },
        screeenshotGaps: { top: 50, bottom: 100, left: 1000 },
        fileName: 'change-route-responses-default.png'
      },
      {
        tasks: async () => {
          await routes.toggleRouteResponseRandom();
        },
        get highlightedTarget() {
          return routes.randomResponseBtn;
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { top: 20, bottom: 120, left: 1100 },
        fileName: 'random-route-responses.png'
      },
      {
        tasks: async () => {
          await routes.toggleRouteResponseSequential();
        },
        get highlightedTarget() {
          return routes.sequentialResponseBtn;
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { top: 20, bottom: 120, left: 1120 },
        fileName: 'sequential-route-responses.png'
      },
      {
        tasks: async () => {
          await routes.toggleRouteResponseFallback();
        },
        get highlightedTarget() {
          return routes.fallbackResponseBtn;
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { top: 20, bottom: 120, left: 1160 },
        fileName: 'fallback-mode-responses.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'route-responses/dynamic-rules',
    screenshots: [
      {
        tasks: async () => {
          await routes.select(1);
          await navigation.switchView('ENV_ROUTES');
          await routes.switchTab('RULES');
        },
        get highlightedTarget() {
          return routes.getResponseRule(1);
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 10, right: 5, bottom: 40, left: 10 },
        screeenshotGaps: { top: 200, bottom: 20, left: 20 },
        fileName: 'add-route-response-rule.png'
      },
      {
        tasks: async () => {
          await routes.addResponseRule({
            target: 'query',
            modifier: 'param1',
            value: 'value',
            operator: 'equals',
            invert: false
          });
        },
        get highlightedTarget() {
          return routes.getResponseRuleReorderBtn(1);
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 5, right: 5, bottom: 50, left: 5 },
        screeenshotGaps: { top: 200, bottom: 50, left: 1150 },
        fileName: 'route-response-rule-reorder.png'
      },
      {
        tasks: async () => {
          await routes.toggleRouteResponseDisableRules();
        },
        get highlightedTarget() {
          return routes.disableRulesResponseBtn;
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { top: 10, bottom: 200, left: 1150 },
        fileName: 'disable-rules.png'
      },
      {
        tasks: async () => {
          await routes.toggleRouteResponseDisableRules();
        },
        get highlightedTarget() {
          return routes.responseRuleOperatorToggle;
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: -15, right: 5, bottom: -15, left: 5 },
        screeenshotGaps: { top: 120, bottom: 50, left: 20 },
        fileName: 'route-response-rules-operator.png'
      },
      {
        tasks: async () => {
          await routes.removeResponseRule(2);
        },
        get screenshotTarget() {
          return routes.getResponseRule(1);
        },
        get highlightedTarget() {
          return routes.getResponseRuleTarget(1);
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { top: 120, bottom: 50, left: 50 },
        fileName: 'route-response-rules-target.png'
      },
      {
        tasks: async () => {},
        get screenshotTarget() {
          return routes.getResponseRule(1);
        },
        get highlightedTarget() {
          return routes.getResponseRuleModifier(1);
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { top: 120, bottom: 50, left: 50 },
        fileName: 'route-response-rules-property.png'
      },
      {
        tasks: async () => {},
        get screenshotTarget() {
          return routes.getResponseRule(1);
        },
        get highlightedTarget() {
          return routes.getResponseRuleInvert(1);
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { top: 120, bottom: 50, left: 50 },
        fileName: 'route-response-rules-invert-operator.png'
      },
      {
        tasks: async () => {},
        get screenshotTarget() {
          return routes.getResponseRule(1);
        },
        get highlightedTarget() {
          return routes.getResponseRuleOperator(1);
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { top: 120, bottom: 50, left: 50 },
        fileName: 'route-response-rules-comparison-operator.png'
      },
      {
        tasks: async () => {},
        get screenshotTarget() {
          return routes.getResponseRule(1);
        },
        get highlightedTarget() {
          return routes.getResponseRulevalue(1);
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { top: 120, bottom: 50, left: 50 },
        fileName: 'route-response-rules-value.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'data-buckets/overview',
    screenshots: [
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
        },
        get highlightedTarget() {
          return navigation.databucketsTab;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { top: 0, left: 0 },
        screeenshotGaps: { right: 400, bottom: 125 },
        fileName: 'open-data-view.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_DATABUCKETS');
          await databuckets.add();
        },
        get highlightedTarget() {
          return databuckets.addBtn;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { left: 0, top: 0, right: 0 },
        screeenshotGaps: { bottom: 500 },
        fileName: 'add-data-bucket.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'data-buckets/using-data-buckets',
    screenshots: [
      {
        tasks: async () => {
          await databuckets.add();
          await databuckets.setName('Data 1');
          await navigation.switchView('ENV_ROUTES');
          await routes.switchTab('RESPONSE');
          await routes.selectBodyType(BodyTypes.DATABUCKET);
          await routes.openDataBucketMenu();
          await routes.selectDataBucket(1);
        },
        get highlightedTarget() {
          return routes.bodyDataBucketSelect;
        },
        highlight: true,
        highlightGaps: { top: 5, right: 5, bottom: 5, left: 5 },
        screenshotPosition: { right: 0 },
        screeenshotGaps: { top: 270, left: 40, bottom: 150 },
        fileName: 'link-data-bucket-response.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'templating/overview',
    screenshots: [
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
          await routes.select(5);
        },
        highlightedTarget: null,
        get screenshotTarget() {
          return routes.bodyEditor;
        },
        highlight: false,
        highlightGaps: { top: 5, right: 5, bottom: 5, left: 5 },
        screenshotPosition: { right: 0 },
        screeenshotGaps: { top: 55, left: 55, bottom: 0 },
        fileName: 'body-templating.png'
      },
      {
        tasks: async () => {
          await routes.switchTab('RESPONSE');
        },
        get screenshotTarget() {
          return routes.routeResponseMenu;
        },
        get highlightedTarget() {
          return routes.settingsTab;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { right: 0 },
        screeenshotGaps: { top: 20, left: 40, bottom: 50 },
        fileName: 'open-route-response-settings.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
          await routes.switchTab('SETTINGS');
          await routes.toggleDisableTemplating();
        },
        get highlightedTarget() {
          return routes.disableTemplatingElement;
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 5, right: 30, bottom: 5, left: 30 },
        screeenshotGaps: { top: 100, bottom: 50, left: 80 },
        fileName: 'disable-route-response-templating.png'
      },
      {
        tasks: async () => {
          await routes.switchTab('RESPONSE');
          await routes.selectBodyType(BodyTypes.FILE);
          await utils.setElementValue(
            routes.fileInput,
            "./file{{urlParam 'id'}}.json"
          );
        },
        get highlightedTarget() {
          return routes.fileInput;
        },
        highlight: false,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 10, right: 70, bottom: 60, left: 10 },
        screeenshotGaps: { top: 100, bottom: 50, left: 20 },
        fileName: 'file-path-templating.png'
      },
      {
        tasks: async () => {
          await routes.switchTab('HEADERS');
          await headersUtils.remove('route-response-headers', 1);
          await headersUtils.add('route-response-headers', {
            key: 'Content-Type',
            value: "{{header 'Accept'}}"
          });
        },
        get screenshotTarget() {
          return routes.routeResponseMenu;
        },
        highlightedTarget: null,
        highlight: false,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { right: 0 },
        screeenshotGaps: { top: 20, left: 40, bottom: 120 },
        fileName: 'headers-templating.png'
      },
      {
        tasks: async () => {
          await routes.switchTab('RULES');
          await routes.addResponseRule({
            target: 'header',
            value: "{{data 'token'}}",
            invert: false,
            modifier: "{{data 'headerName'}}",
            operator: 'equals'
          });
        },
        get screenshotTarget() {
          return routes.getResponseRule(1);
        },
        get highlightedTarget() {
          return routes.getResponseRulevalue(1);
        },
        highlight: false,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { right: 0 },
        screeenshotGaps: { top: 60, left: 40, bottom: 60 },
        fileName: 'template-helper-response-rule-value.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'templating/fakerjs-helpers',
    screenshots: [
      {
        tasks: async () => {
          await settings.open();
        },
        get highlightedTarget() {
          return $('app-title-separator[heading="Faker.js"]');
        },
        get screenshotTarget() {
          return modals.content;
        },
        highlight: true,
        highlightGaps: { top: 5, right: 5, bottom: 100, left: 5 },
        screenshotPosition: {},
        screeenshotGaps: { top: 30, left: 30, bottom: 30, right: 30 },
        fileName: 'settings-faker.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'mockoon-data-files/data-files-location',
    screenshots: [
      {
        tasks: async () => {
          await modals.close();
          await navigation.switchView('ENV_ROUTES');
          await utils.dropdownMenuOpen(
            `.environments-menu div:first-of-type .nav-item:nth-child(${1}) .nav-link`
          );
        },
        postTasks: async () => {
          await utils.dropdownMenuClose();
        },
        get highlightedTarget() {
          return utils.dropdownMenuGetItemRef(
            DropdownMenuEnvironmentActions.SHOW_FOLDER
          );
        },
        highlight: true,
        screenshotPosition: { top: 0, left: 0 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { right: 150, bottom: 150 },
        fileName: 'environment-show-in-folder.png'
      },
      {
        tasks: async () => {
          await utils.dropdownMenuOpen(
            `.environments-menu div:first-of-type .nav-item:nth-child(${1}) .nav-link`
          );
        },
        postTasks: async () => {
          await utils.dropdownMenuClose();
        },
        get highlightedTarget() {
          return utils.dropdownMenuGetItemRef(
            DropdownMenuEnvironmentActions.MOVE_FOLDER
          );
        },
        highlight: true,
        screenshotPosition: { top: 0, left: 0 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { right: 150, bottom: 150 },
        fileName: 'environment-move-to-folder.png'
      },
      {
        tasks: async () => {
          await settings.open();
          (await settings.fileWatchingInputGroup).scrollIntoView();
          await browser.pause(500);
        },
        postTasks: async () => {
          await modals.close();
        },
        get screenshotTarget() {
          return modals.content;
        },
        get highlightedTarget() {
          return settings.fileWatchingInputGroup;
        },
        highlight: true,
        highlightGaps: { top: 5, right: 5, bottom: 5, left: 5 },
        screenshotPosition: {},
        screeenshotGaps: { bottom: 30, right: 30, left: 30, top: 30 },
        fileName: 'enable-file-watching.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'mockoon-data-files/sharing-mock-api-files',
    screenshots: [
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
          await routes.select(1);
          await environments.openAddMenu();
        },
        get highlightedTarget() {
          return environments.getAddMenuEntry(2);
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { top: 0, left: 0 },
        screeenshotGaps: { bottom: 200, right: 350 },
        fileName: 'open-environment.png'
      },
      {
        tasks: async () => {
          await settings.open();
          (await settings.prettyPrint).scrollIntoView();
          await browser.pause(500);
        },
        postTasks: async () => {
          await modals.close();
        },
        get screenshotTarget() {
          return modals.content;
        },
        get highlightedTarget() {
          return settings.prettyPrint;
        },
        highlight: true,
        highlightGaps: { top: 5, right: 10, bottom: 5, left: 30 },
        screenshotPosition: {},
        screeenshotGaps: { bottom: 30, right: 30, left: 30, top: 30 },
        fileName: 'storage-pretty-printing.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
          await routes.select(1);
          await utils.dropdownMenuOpen(
            `.environments-menu div:first-of-type .nav-item:nth-child(${1}) .nav-link`
          );
        },
        postTasks: async () => {
          await utils.dropdownMenuClose();
        },
        get highlightedTarget() {
          return utils.dropdownMenuGetItemRef(
            DropdownMenuEnvironmentActions.COPY_JSON
          );
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { top: 0, left: 0 },
        screeenshotGaps: { bottom: 200, right: 350 },
        fileName: 'export-clipboard-env.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'api-endpoints/folders',
    screenshots: [
      {
        tasks: async () => {
          await environments.close(1);
          await environments.open('empty');
          await navigation.switchView('ENV_SETTINGS');
          await environmentsSettings.setSettingValue('name', 'Demo API');
          await navigation.switchView('ENV_ROUTES');
          await routes.addFolder();
          await (await routes.getMenuItemEditable(1)).click();
          await routes.setMenuItemEditableText(1, 'Users');
          await utils.dropdownMenuClick(
            `.routes-menu .nav-item:nth-child(${1}) .nav-link`,
            DropdownMenuFolderActions.ADD_HTTP
          );
          await routes.pathInput.setValue('/users');
          await utils.dropdownMenuClick(
            `.routes-menu .nav-item:nth-child(${1}) .nav-link`,
            DropdownMenuFolderActions.ADD_HTTP
          );
          await routes.pathInput.setValue('/users/:id');
          await routes.addFolder();
          await (await routes.getMenuItemEditable(4)).click();
          await routes.setMenuItemEditableText(4, 'Invoices');
          await utils.dropdownMenuClick(
            `.routes-menu .nav-item:nth-child(${4}) .nav-link`,
            DropdownMenuFolderActions.ADD_HTTP
          );
          await routes.pathInput.setValue('/invoices');
          await utils.dropdownMenuClick(
            `.routes-menu .nav-item:nth-child(${4}) .nav-link`,
            DropdownMenuFolderActions.ADD_HTTP
          );
          await routes.pathInput.setValue('/invoices/:id');
        },
        postTasks: async () => {
          await routes.remove(2);
          await routes.remove(2);
          await routes.removeFolder(1);
          await routes.remove(2);
          await routes.remove(2);
          await routes.removeFolder(1);
        },
        get screenshotTarget() {
          return routes.getMenuItem(1);
        },
        highlightedTarget: null,
        highlight: false,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { left: 0, top: 0 },
        screeenshotGaps: { right: 500, bottom: 400 },
        fileName: 'routes-nested-folder.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'api-endpoints/http-routes',
    screenshots: [
      {
        tasks: async () => {
          await routes.openAddMenu();
        },
        postTasks: async () => {
          await utils.clickOutside();
        },
        get screenshotTarget() {
          return routes.addMenu;
        },
        get highlightedTarget() {
          return routes.getAddMenuEntry(RoutesMenuActions.ADD_HTTP_ROUTE);
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { left: 0, top: 0 },
        screeenshotGaps: { right: 150, bottom: 100 },
        fileName: 'add-http-route.png'
      },
      {
        tasks: async () => {
          await routes.addHTTPRoute();
          await routes.setPath('endpoint');
        },
        postTasks: async () => {
          await routes.remove(1);
        },
        get screenshotTarget() {
          return routes.pathInput;
        },
        get highlightedTarget() {
          return routes.pathInput;
        },
        highlight: false,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { left: 0, top: 0 },
        screeenshotGaps: { right: 100, bottom: 400 },
        fileName: 'new-http-route.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'api-endpoints/crud-routes',
    screenshots: [
      {
        tasks: async () => {
          await routes.openAddMenu();
        },
        postTasks: async () => {
          await utils.clickOutside();
        },
        get screenshotTarget() {
          return routes.addMenu;
        },
        get highlightedTarget() {
          return routes.getAddMenuEntry(RoutesMenuActions.ADD_CRUD_ROUTE);
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { left: 0, top: 0 },
        screeenshotGaps: { right: 150, bottom: 100 },
        fileName: 'add-crud-route.png'
      },
      {
        tasks: async () => {
          await routes.addCRUDRoute();
          await routes.setPath('users');
        },
        get screenshotTarget() {
          return routes.pathInput;
        },
        get highlightedTarget() {
          return routes.pathInput;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { left: 0, top: 0 },
        screeenshotGaps: { right: 100, bottom: 100 },
        fileName: 'set-crud-route-path.png'
      },
      {
        tasks: async () => {},
        get screenshotTarget() {
          return routes.bodyDataBucketSelect;
        },
        get highlightedTarget() {
          return routes.bodyDataBucketSelect;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { right: 0, left: 0 },
        screeenshotGaps: { top: 200, bottom: 100 },
        fileName: 'link-data-bucket-crud-route.png'
      },
      {
        tasks: async () => {},
        get screenshotTarget() {
          return routes.idPropertyDataBucketSelect;
        },
        get highlightedTarget() {
          return routes.idPropertyDataBucketSelect;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { right: 0, left: 0 },
        screeenshotGaps: { top: 200, bottom: 100 },
        fileName: 'customize-crud-id-property-key.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'mockoon-cloud/templates-and-ai-assistant',
    screenshots: [
      {
        tasks: async () => {
          await routes.remove(1);
          await navigation.switchView('ENV_ROUTES');

          await routes.openAddMenu();
        },
        get screenshotTarget() {
          return routes.addMenu;
        },
        get highlightedTarget() {
          return routes.getAddMenuEntry(RoutesMenuActions.OPEN_TEMPLATES);
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { left: 0, top: 0 },
        screeenshotGaps: { right: 150, bottom: 100 },
        fileName: 'pre-generated-templates-modal.png'
      },
      {
        tasks: async () => {
          await $('body').click();
          await routes.openTemplates();
        },
        get highlightedTarget() {
          return $('.modal-footer button:last-of-type');
        },
        get screenshotTarget() {
          return modals.content;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: {},
        screeenshotGaps: { bottom: 30, right: 30, left: 30, top: 30 },
        fileName: 'templates-create-get-route.png'
      },
      {
        tasks: async () => {
          await routes.selectTemplateTab(2);
        },
        get highlightedTarget() {
          return routes.getTemplateTab(2);
        },
        get screenshotTarget() {
          return modals.content;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: {},
        screeenshotGaps: { bottom: 30, right: 30, left: 30, top: 30 },
        fileName: 'ai-assistant-generate-template-tab.png'
      },
      {
        tasks: async () => {},
        get highlightedTarget() {
          return routes.templateGenerateOptions;
        },
        get screenshotTarget() {
          return modals.content;
        },
        highlight: true,
        highlightGaps: { top: 5, right: 5, bottom: 5, left: 5 },
        screenshotPosition: {},
        screeenshotGaps: { bottom: 30, right: 30, left: 30, top: 30 },
        fileName: 'ai-assistant-template-generate-option.png'
      },
      {
        tasks: async () => {
          await routes.setTemplatePrompt('list of users');
        },
        get highlightedTarget() {
          return routes.templateGenerateBtn;
        },
        get screenshotTarget() {
          return modals.content;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: {},
        screeenshotGaps: { bottom: 30, right: 30, left: 30, top: 30 },
        fileName: 'ai-assistant-generate-button.png'
      },
      {
        tasks: async () => {
          await routes.clickTemplateGenerate();
          // account for openai api call
          await browser.pause(20000);
        },
        get highlightedTarget() {
          return $('.modal-footer .ms-auto button:last-of-type');
        },
        get screenshotTarget() {
          return modals.content;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: {},
        screeenshotGaps: { bottom: 30, right: 30, left: 30, top: 30 },
        fileName: 'templates-generate-get-route.png'
      },
      {
        tasks: async () => {
          await routes.selectTemplateTab(3);
        },
        get highlightedTarget() {
          return routes.getTemplateTab(3);
        },
        get screenshotTarget() {
          return modals.content;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: {},
        screeenshotGaps: { bottom: 30, right: 30, left: 30, top: 30 },
        fileName: 'ai-assistant-generate-endpoint-tab.png'
      },
      {
        tasks: async () => {
          await routes.setTemplatePrompt('Get a list of users');
        },
        get highlightedTarget() {
          return routes.endpointGenerateBtn;
        },
        get screenshotTarget() {
          return modals.content;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: {},
        screeenshotGaps: { bottom: 30, right: 30, left: 30, top: 30 },
        fileName: 'ai-assistant-generate-endpoint-button.png'
      },
      {
        tasks: async () => {
          await routes.clickEndpointGenerate();
          // account for openai api call
          await browser.pause(20000);
        },
        postTasks: async () => {
          await modals.close();
        },
        get highlightedTarget() {
          return $('.modal-footer .ms-auto button:last-of-type');
        },
        get screenshotTarget() {
          return modals.content;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: {},
        screeenshotGaps: { bottom: 30, right: 30, left: 30, top: 30 },
        fileName: 'ai-assistant-generate-endpoint-create-button.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'route-responses/global-routes-with-rules',
    screenshots: [
      {
        tasks: async () => {
          await routes.addHTTPRoute();
          await routes.setPath('*');
          await routes.setMethod(1);

          await routes.addHTTPRoute();
          await routes.setPath('users');

          await routes.select(1);
        },
        get highlightedTarget() {
          return routes.getMenuItem(1);
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { left: 0, top: 0 },
        screeenshotGaps: { right: 300, bottom: 200 },
        fileName: 'create-wildcard-route.png'
      },
      {
        tasks: async () => {
          await routes.toggleRouteResponseFallback();
        },
        get highlightedTarget() {
          return routes.fallbackResponseBtn;
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { top: 20, bottom: 120, left: 1250 },
        fileName: 'activate-fallback-mode.png'
      },
      {
        tasks: async () => {
          // 401
          await routes.setRouteResponseStatusCode(30);
        },
        get highlightedTarget() {
          return routes.routeResponseStatusDropdown;
        },
        get screenshotTarget() {
          return routes.routeResponseDropdownlabel;
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { top: 40, bottom: 200, left: 100 },
        fileName: 'response-status-code-401.png'
      },
      {
        tasks: async () => {
          await routes.switchTab('RULES');
          await routes.addResponseRule({
            target: 'header',
            invert: false,
            modifier: 'Authorization',
            operator: 'null',
            value: ''
          });
        },
        get highlightedTarget() {
          return routes.getResponseRule(1);
        },
        highlight: true,
        screenshotPosition: { right: 0 },
        highlightGaps: { top: 10, right: 5, bottom: 40, left: 10 },
        screeenshotGaps: { top: 200, bottom: 20, left: 20 },
        fileName: 'response-rule-header-null.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'callbacks/overview',
    screenshots: [
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
        },
        get highlightedTarget() {
          return navigation.callbacksTab;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { top: 0, left: 0 },
        screeenshotGaps: { right: 400, bottom: 125 },
        fileName: 'open-callbacks-view.png'
      },
      {
        tasks: async () => {
          await navigation.switchView('ENV_CALLBACKS');
          await callbacks.add();
        },
        get highlightedTarget() {
          return callbacks.addBtn;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { left: 0, top: 0, right: 0 },
        screeenshotGaps: { bottom: 500 },
        fileName: 'add-callback.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'callbacks/using-callbacks',
    screenshots: [
      {
        tasks: async () => {
          await navigation.switchView('ENV_ROUTES');
          await routes.switchTab('RESPONSE');
        },
        get screenshotTarget() {
          return routes.routeResponseMenu;
        },
        get highlightedTarget() {
          return routes.callbacksTab;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { right: 0 },
        screeenshotGaps: { top: 20, left: 40, bottom: 50 },
        fileName: 'open-route-response-callbacks.png'
      },
      {
        tasks: async () => {
          await routes.switchTab('CALLBACKS');
          await callbacks.attachCallback();
        },
        get highlightedTarget() {
          return callbacks.attachCallbackBtn;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { right: 0 },
        screeenshotGaps: { top: 150, bottom: 50, left: 20 },
        fileName: 'link-callback-response.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'variables/environment-variables',
    screenshots: [
      {
        tasks: async () => {
          await settings.open();
        },
        postTasks: async () => {
          await modals.close();
        },
        get highlightedTarget() {
          return $('app-title-separator[heading="Environment variables"]');
        },
        get screenshotTarget() {
          return modals.content;
        },
        highlight: true,
        highlightGaps: { top: 5, right: 5, bottom: 70, left: 5 },
        screenshotPosition: {},
        screeenshotGaps: { top: 30, left: 30, bottom: 30, right: 30 },
        fileName: 'settings-environment-variables-prefix.png'
      }
    ]
  },
  {
    enabled: true,
    folder: 'api-endpoints/websockets',
    screenshots: [
      {
        tasks: async () => {
          // remove old routes
          await routes.remove(1);
          await routes.remove(1);

          await routes.openAddMenu();
        },
        postTasks: async () => {
          await utils.clickOutside();
        },
        get screenshotTarget() {
          return routes.addMenu;
        },
        get highlightedTarget() {
          return routes.getAddMenuEntry(RoutesMenuActions.ADD_WS_ROUTE);
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { left: 0, top: 0 },
        screeenshotGaps: { right: 150, bottom: 100 },
        fileName: 'add-ws-route.png'
      },
      {
        tasks: async () => {
          await routes.addWebSocketRoute();
          await routes.setPath('messages');
        },
        get screenshotTarget() {
          return routes.pathInput;
        },
        get highlightedTarget() {
          return routes.pathInput;
        },
        highlight: true,
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screenshotPosition: { left: 0, top: 0 },
        screeenshotGaps: { right: 100, bottom: 100 },
        fileName: 'set-ws-route-path.png'
      },
      {
        tasks: async () => {
          await routes.toggleWSRouteStreamingUnicast();
        },
        get highlightedTarget() {
          return routes.websocketRouteUnicastBtn;
        },
        highlight: true,
        screenshotPosition: { left: 0, top: 0, right: 600 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { bottom: 80 },
        fileName: 'toggle-ws-unicast-streaming.png'
      },
      {
        tasks: async () => {
          await routes.toggleWSRouteStreamingBroadcast();
        },
        get highlightedTarget() {
          return routes.websocketRouteBroadcastBtn;
        },
        highlight: true,
        screenshotPosition: { left: 0, top: 0, right: 600 },
        highlightGaps: { top: 0, right: 0, bottom: 0, left: 0 },
        screeenshotGaps: { bottom: 80 },
        fileName: 'toggle-ws-broadcast-streaming.png'
      }
    ]
  }
];

describe('Documentation screenshots', () => {
  it('should open and start the environment', async () => {
    await environments.open('documentation');
  });

  for (const documentationTopic of documentationTopics) {
    if (!documentationTopic.enabled) {
      continue;
    }

    describe(documentationTopic.folder, () => {
      it('Create folder', async () => {
        await fs.mkdir(`./tmp/docs/${documentationTopic.folder}`, {
          recursive: true
        });
      });

      for (const screenshot of documentationTopic.screenshots) {
        it(screenshot.fileName, async () => {
          if (screenshot.tasks) {
            await screenshot.tasks();
          }

          if (screenshot.highlight) {
            await highlight(
              screenshot.highlightedTarget,
              screenshot.highlightGaps
            );
          }

          await takeElementScreenshot(
            screenshot.highlight && !screenshot.screenshotTarget
              ? null
              : screenshot.screenshotTarget || screenshot.highlightedTarget,
            screenshot.screenshotPosition,
            screenshot.screeenshotGaps,
            documentationTopic.folder,
            screenshot.fileName
          );

          await clearElements();

          if (screenshot.postTasks) {
            await screenshot.postTasks();
          }
        });
      }
    });
  }

  xdescribe('Cheat sheet', () => {
    it('should take screenshots for cheat sheet', async () => {
      await fs.mkdir('./tmp/docs-cheat-sheet', {
        recursive: true
      });
      await browser.closeWindow();
      await browser.pause(5000);
      await fs.writeFile(
        './tmp/window-state.json',
        JSON.stringify({
          width: 1495 + 16, // add borders/menus
          height: 900 + 59, // add borders/menus
          x: 150,
          y: 150,
          isMaximized: false,
          isFullScreen: false
        })
      );
      await file.editSettingsAndReload({
        mainMenuSize: 150,
        secondaryMenuSize: 250
      });
      await environments.close(1);
      await environments.open('documentation');

      await navigation.switchView('ENV_PROXY');
      await environmentsProxy.toggleSetting('proxyMode');
      await navigation.switchView('ENV_SETTINGS');
      await environmentsSettings.toggleSetting('enabled');

      await environments.start();
      await http.assertCall({
        method: 'GET',
        path: '/users',
        headers: { 'Content-Type': 'application/json' }
      });

      // routes screenshot
      await navigation.switchView('ENV_ROUTES');
      await routes.switchTab('RESPONSE');
      await routes.selectBodyType(BodyTypes.INLINE);
      await browser.saveScreenshot('./tmp/docs-cheat-sheet/routes-view.png');

      // databuckets screenshot
      await navigation.switchView('ENV_DATABUCKETS');
      await browser.saveScreenshot(
        './tmp/docs-cheat-sheet/databuckets-view.png'
      );

      // logs screenshot
      await navigation.switchView('ENV_LOGS');
      await browser.saveScreenshot('./tmp/docs-cheat-sheet/logs-view.png');

      // proxy screenshot
      await navigation.switchView('ENV_PROXY');
      await browser.saveScreenshot('./tmp/docs-cheat-sheet/proxy-view.png');

      // settings screenshot
      await navigation.switchView('ENV_SETTINGS');
      await browser.saveScreenshot('./tmp/docs-cheat-sheet/settings-view.png');
    });
  });
});
