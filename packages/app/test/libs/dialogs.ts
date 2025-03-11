import electronMock from '../libs/electron-mock';

class Dialogs {
  public async open(filePath: string) {
    await electronMock.call(`/dialogs#open#${filePath}`);
  }

  public async save(filePath: string) {
    await electronMock.call(`/dialogs#save#${filePath}`);
  }
}

export default new Dialogs();
