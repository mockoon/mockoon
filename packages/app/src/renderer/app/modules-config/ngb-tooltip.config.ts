import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';

export const NgbTooltipConfigFactory = (): NgbTooltipConfig => {
  const ngbTooltipConfig = new NgbTooltipConfig();

  ngbTooltipConfig.container = 'body';
  ngbTooltipConfig.triggers = 'hover';

  return ngbTooltipConfig;
};
