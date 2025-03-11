import { NgbConfig } from '@ng-bootstrap/ng-bootstrap';

export const NgbConfigFactory = (): NgbConfig => {
  const ngbConfig = new NgbConfig();

  ngbConfig.animation = false;

  return ngbConfig;
};
