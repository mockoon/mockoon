import { Placement } from '@ng-bootstrap/ng-bootstrap';

export type TourStep = {
  id: string;
  title: string;
  content: string;
  link?: string;
  placement: Placement;
};
