export type DraggableContainerNames =
  | 'routes'
  | 'environments'
  | 'routeResponses';

export enum ScrollDirection {
  TOP = 'TOP',
  BOTTOM = 'BOTTOM'
}

export type ConfirmModalEvent = {
  title: string;
  text: string;
  sub?: string;
  subIcon?: string;
  subIconClass?: string;
  confirmCallback: () => void;
};
