import { NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';

export const NgbModalConfigFactory = (): NgbModalConfig => {
  const ngbModalConfig = new NgbModalConfig({ animation: false });

  ngbModalConfig.backdrop = 'static';
  ngbModalConfig.centered = true;

  return ngbModalConfig;
};
