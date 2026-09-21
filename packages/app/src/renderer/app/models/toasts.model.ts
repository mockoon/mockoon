export type ToastTypes = 'error' | 'success' | 'warning';
export type ToastAction = {
  label: string;
  action: () => void;
};
export type Toast = {
  UUID: string;
  message: string;
  type: ToastTypes;
  action?: ToastAction;
};
