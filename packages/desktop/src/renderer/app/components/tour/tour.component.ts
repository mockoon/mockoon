import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { Observable, map } from 'rxjs';
import { TourService } from 'src/renderer/app/services/tour.service';

@Component({
  selector: 'app-tour',
  templateUrl: 'tour.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class TourComponent implements OnInit, AfterViewInit {
  @ViewChild('popover') public popoverRef: TemplateRef<HTMLElement>;

  public backdropSizes$: Observable<
    { top: number; left: number; width: number; height: number }[]
  >;

  constructor(private tourService: TourService) {}

  ngOnInit() {
    this.backdropSizes$ = this.tourService.currentHostElement$.pipe(
      map((element) => {
        if (!element) {
          return [];
        }

        // display the 4 backdrops around the element

        // get element position
        const elementPosition = element.getBoundingClientRect();

        // get window size
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // calculate backdrop sizes
        const topHeight = elementPosition.top;
        const leftWidth = elementPosition.left;
        const rightWidth = windowWidth - elementPosition.right;
        const bottomHeight = windowHeight - elementPosition.bottom;

        return [
          {
            top: 0,
            left: 0,
            width: windowWidth,
            height: topHeight
          },
          {
            top: topHeight,
            left: 0,
            width: leftWidth,
            height: elementPosition.height
          },
          {
            top: topHeight,
            left: elementPosition.right,
            width: rightWidth,
            height: elementPosition.height
          },
          {
            top: elementPosition.bottom,
            left: 0,
            width: windowWidth,
            height: bottomHeight
          }
        ];
      })
    );
  }

  ngAfterViewInit() {
    this.tourService.registerTemplateRef(this.popoverRef);
  }

  public previous() {
    this.tourService.previous();
  }

  public next() {
    this.tourService.next();
  }

  public close() {
    this.tourService.stop();
  }
}
