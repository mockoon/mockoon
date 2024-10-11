import { Placement } from '@ng-bootstrap/ng-bootstrap';

export type TourStep = {
  id: string;
  title: string;
  content: string;
  links?: { url: string; text?: string }[];
  placement: Placement;
};
