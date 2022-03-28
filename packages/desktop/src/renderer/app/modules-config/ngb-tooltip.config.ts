import { NgbConfig, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';

export const NgbTooltipConfigFactory = (
  ngbConfig: NgbConfig
): NgbTooltipConfig => {
  const ngbTooltipConfig = new NgbTooltipConfig(ngbConfig);

  ngbTooltipConfig.container = 'body';

  return ngbTooltipConfig;
};
