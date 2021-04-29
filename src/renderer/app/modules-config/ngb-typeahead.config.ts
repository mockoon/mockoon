import { NgbTypeaheadConfig } from '@ng-bootstrap/ng-bootstrap';

export const NgbTypeaheadConfigFactory = (): NgbTypeaheadConfig => {
  const ngbTypeaheadConfig = new NgbTypeaheadConfig();

  ngbTypeaheadConfig.container = 'body';

  return ngbTypeaheadConfig;
};
