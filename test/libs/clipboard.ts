import electronMock from '../libs/electron-mock';

class Clipboard {
  public async read() {
    return (await electronMock.call('/clipboard#read')).body as string;
  }

  public async write(text: string) {
    await electronMock.call('/clipboard#write', text);
  }
}

export default new Clipboard();
