import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, filter, switchMap, tap } from 'rxjs';
import { TourService } from 'src/renderer/app/services/tour.service';

/**
 * Focus an input when an event is emitted with the input's name
 */
@Directive({
  standalone: true,
  hostDirectives: [{ directive: NgbPopover }],
  selector: '[appTourStep]'
})
export class TourStepDirective implements OnInit, OnDestroy {
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private tourService = inject(TourService);
  private ngbPopover = inject(NgbPopover, { host: true });

  // step id
  @Input() public appTourStep: string;
  private tourStepSubscription: Subscription;

  constructor() {
    this.ngbPopover.triggers = 'manual';
    this.ngbPopover.container = 'body';
    this.ngbPopover.autoClose = false;
  }

  public ngOnInit() {
    this.tourStepSubscription = this.tourService.steps$
      .pipe(
        filter((nextStep) => nextStep.data.id === this.appTourStep),
        switchMap((nextStep) => {
          this.elementRef.nativeElement.classList.add('tour-highlight');

          this.ngbPopover.ngbPopover = this.tourService.getPopoverTemplateRef();
          this.ngbPopover.popoverContext = nextStep;
          this.ngbPopover.placement = nextStep.data.placement;

          this.ngbPopover.open();

          this.tourService.registerElements(
            this.ngbPopover,
            this.elementRef.nativeElement
          );

          return this.ngbPopover.hidden;
        }),
        tap(() => {
          this.elementRef.nativeElement.classList.remove('tour-highlight');
        })
      )
      .subscribe();
  }

  public ngOnDestroy() {
    this.tourStepSubscription.unsubscribe();
  }
}
