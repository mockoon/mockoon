export type BannerType = {
  id: string;
  enabled: boolean;
  text: string;
  link: string;
  classes?: string;
  styles?: { [key: string]: string };
  iconName?: string;
};
