import { NgbDropdownConfig } from '@ng-bootstrap/ng-bootstrap';

export const NgbDropdownConfigFactory = (): NgbDropdownConfig => {
  const ngbDropdownConfig = new NgbDropdownConfig();

  ngbDropdownConfig.container = 'body';

  return ngbDropdownConfig;
};
