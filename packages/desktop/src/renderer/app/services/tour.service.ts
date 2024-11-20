import { Injectable, TemplateRef } from '@angular/core';
import { BuildHTTPRoute } from '@mockoon/commons';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { TourStep } from 'src/renderer/app/models/tour.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import {
  addRouteAction,
  removeRouteAction
} from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Injectable({ providedIn: 'root' })
export class TourService {
  public steps$ = new Subject<{
    data: TourStep;
    current: number;
    total: number;
  }>();
  public currentHostElement$ = new Subject<HTMLElement>();
  private currentStep = -1;
  private steps: TourStep[] = [
    {
      id: 'tour-environments-menu',
      title: 'Environments list',
      content:
        'This is the list of your <strong>environments or mock APIs</strong>. Each local environment is a separate file on your computer and runs on a different localhost port (e.g. <code>http://localhost:3000</code>).<br/>You can also create <strong>cloud environments</strong> by subscribing to Mockoon Cloud.',
      placement: 'right',
      links: [
        {
          url: 'https://mockoon.com/docs/latest/mockoon-data-files/data-files-location/',
          text: 'Local environments documentation'
        },
        {
          url: Config.docs.cloudSync,
          text: 'Cloud environments documentation'
        }
      ]
    },
    {
      id: 'tour-routes-menu',
      title: 'Routes list',
      content:
        'This is the <strong>list of routes</strong>, or API endpoints, for the selected environment. You can add as many routes as you want to an environment and arrange them into folders.',
      placement: 'right',
      links: [
        {
          url: 'https://mockoon.com/docs/latest/api-endpoints/routing/',
          text: 'Routing documentation'
        }
      ]
    },
    {
      id: 'tour-route-add',
      title: 'Adding more routes',
      content:
        'You can always add more routes using this menu. Mockoon supports a wide range of <strong>HTTP routes</strong> and also provides <strong>fully automated CRUD routes</strong>.',
      placement: 'bottom-left',
      links: [
        {
          url: 'https://mockoon.com/docs/latest/api-endpoints/crud-routes/',
          text: 'CRUD routes documentation'
        }
      ]
    },
    {
      id: 'tour-route-config',
      title: 'Configure a route',
      content:
        'Here, you can set up your route <strong>method and path</strong>. They support <strong>parameters</strong>, <strong>wildcards</strong>, and <strong>regexes</strong> and can be <strong>prefixed</strong>.',
      placement: 'bottom',
      links: [
        {
          url: 'https://mockoon.com/docs/latest/api-endpoints/routing/#route-patterns-and-regexes',
          text: 'Routes path documentation'
        }
      ]
    },
    {
      id: 'tour-route-response-add',
      title: 'Add responses',
      content:
        'This is where you can add <strong>multiple responses</strong> to your route with different contents (body, file, etc.).',
      placement: 'bottom',
      links: [
        {
          url: 'https://mockoon.com/docs/latest/route-responses/multiple-responses/',
          text: 'Route responses documentation'
        }
      ]
    },
    {
      id: 'tour-route-response-modes',
      title: 'Randomize your responses',
      content:
        'You can serve your different responses <strong>sequentially or randomly</strong>...',
      placement: 'left',
      links: [
        {
          url: 'https://mockoon.com/docs/latest/route-responses/multiple-responses/#random-route-response',
          text: 'Response modes documentation'
        }
      ]
    },
    {
      id: 'tour-route-response-rules',
      title: 'Create rules',
      content:
        '... or you can use <strong>complex rules</strong> to serve your responses based on the <strong>request parameters</strong> (presence of a header, etc.).',
      placement: 'bottom',
      links: [
        {
          url: 'https://mockoon.com/docs/latest/route-responses/dynamic-rules/',
          text: 'Response rules documentation'
        }
      ]
    },
    {
      id: 'tour-route-response-config',
      title: 'Configure a response',
      content:
        "Here, you can set up your response's status code, delay, and body. You can easily create <strong>realistic and dynamic content</strong> using our <strong>templating system</strong>.",
      placement: 'top',
      links: [
        {
          url: 'https://mockoon.com/docs/latest/response-configuration/response-body/',
          text: 'Response body documentation'
        }
      ]
    },
    {
      id: 'tour-environment-start',
      title: 'Run your environment',
      content:
        'After you configured your environment, you can start it, and it will <strong>run on your local machine</strong>. <br/>You can also run your mock API on your <strong>server or CI environment</strong> using our CLI or Docker image.',
      placement: 'bottom-left',
      links: [{ url: 'https://mockoon.com/cli/', text: 'Discover the CLI' }]
    },
    {
      id: 'tour-environment-logs',
      title: 'View your environment logs',
      content:
        'You can view your environment logs here. They will show you the <strong>requests</strong> made to your environment and how Mockoon responded. You can also <strong>automatically create endpoints</strong> from your logs.',
      placement: 'bottom',
      links: [
        {
          url: 'https://mockoon.com/docs/latest/logging-and-recording/requests-logging/',
          text: 'Requests logging documentation'
        }
      ]
    },
    {
      id: 'tour-environment-proxy',
      title: 'Proxy to an external API',
      content:
        'Using the proxy mode, you can <strong>partially mock</strong> your API by forwarding the calls to endpoints not declared in Mockoon.',
      placement: 'bottom',
      links: [
        {
          url: 'https://mockoon.com/docs/latest/server-configuration/proxy-mode/',
          text: 'Proxy mode documentation'
        }
      ]
    }
  ];
  private popoverTemplateRef: TemplateRef<HTMLElement>;
  private openedPopover: NgbPopover;
  private newRouteUuid: string;
  private tourInProgress = false;

  constructor(
    private store: Store,
    private environmentService: EnvironmentsService
  ) {}

  /**
   * Register the popover template ref from the tour component
   *
   * @param popoverTemplateRef
   */
  public registerTemplateRef(popoverTemplateRef: TemplateRef<HTMLElement>) {
    this.popoverTemplateRef = popoverTemplateRef;
  }

  /**
   * Register the current host element and popover from the tour step component
   *
   * @param popover
   * @param element
   */
  public registerElements(popover: NgbPopover, element: HTMLElement) {
    this.openedPopover = popover;
    this.currentHostElement$.next(element);
  }

  public getPopoverTemplateRef() {
    return this.popoverTemplateRef;
  }

  /**
   * Starts the tour and prepares the environment
   *
   * @returns
   */
  public start() {
    if (!this.canStart()) {
      return;
    }

    this.prepareEnvironment();

    this.currentStep = 0;
    this.tourInProgress = true;

    this.steps$.next({
      data: this.steps[this.currentStep],
      current: this.currentStep + 1,
      total: this.steps.length
    });
  }

  /**
   * Triggers the previous step
   */
  public previous() {
    this.openedPopover.close();
    this.currentStep--;

    this.steps$.next({
      data: this.steps[this.currentStep],
      current: this.currentStep + 1,
      total: this.steps.length
    });
  }

  /**
   * Triggers the next step
   *
   * @returns
   */
  public next() {
    this.openedPopover.close();
    this.currentStep++;

    if (this.currentStep === this.steps.length) {
      this.stop();

      return;
    }

    this.steps$.next({
      data: this.steps[this.currentStep],
      current: this.currentStep + 1,
      total: this.steps.length
    });
  }

  /**
   * Stops the tour and cleans up the environment
   */
  public stop() {
    this.currentHostElement$.next(null);
    this.openedPopover.close();
    this.tourInProgress = false;

    this.store.update(
      removeRouteAction(
        this.store.getActiveEnvironment().uuid,
        this.newRouteUuid
      ),
      false,
      // avoid emitting and triggering the sync
      false
    );

    this.newRouteUuid = null;
  }

  public isInProgress() {
    return this.tourInProgress;
  }

  private canStart() {
    const activeEnvironment = this.store.getActiveEnvironment();

    return activeEnvironment;
  }

  /**
   * Prepare the environment for the tour:
   * - add a new route
   * - set the active view to ENV_ROUTES
   */
  private prepareEnvironment() {
    const activeEnvironment = this.store.getActiveEnvironment();

    this.environmentService.setActiveView('ENV_ROUTES');

    const newRoute = BuildHTTPRoute(true, {
      endpoint: 'users/:param',
      body: JSON.stringify(
        {
          id: "{{faker 'string.uuid'}}",
          message: 'Hello world!'
        },
        null,
        2
      )
    });
    this.newRouteUuid = newRoute.uuid;

    this.store.update(
      addRouteAction(activeEnvironment.uuid, newRoute, 'root', true),
      false,
      // avoid emitting and triggering the sync
      false
    );
  }
}
