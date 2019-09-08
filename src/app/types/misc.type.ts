import { Request } from 'express';

export type BannerConfigType = {
  id: string;
  enabled: boolean;
  text: string;
  link: string;
  classes?: string;
  styles?: { [key: string]: string };
  iconName?: string;
};

export interface IEnhancedRequest extends Request {
  uuid: string;
}
