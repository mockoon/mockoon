import { MainAPIModel } from 'src/renderer/app/models/main-api.model';
import { Settings } from 'src/shared/models/settings.model';

export const initMainApi = (): MainAPIModel => ({
  send: function () {},
  invoke: function (channel: string, ...data: any[]) {
    return new Promise<any>((resolve) => {
      if (channel === 'APP_READ_SETTINGS_DATA') {
        resolve({} as Settings);
      } else if (channel === 'APP_BUILD_STORAGE_FILEPATH') {
        resolve(data[0] as string);
      } else if (channel === 'APP_GET_PLATFORM') {
        resolve(navigator.platform as string);
      }
    });
  },
  receive: function () {}
});
