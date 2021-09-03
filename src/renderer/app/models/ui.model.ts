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
  confirmCallback: () => void;
};
