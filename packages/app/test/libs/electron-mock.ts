import http from '../libs/http';

class ElectronMock {
  public async call(path: string, body?: any) {
    return await http.assertCallWithPort({ method: 'POST', path, body }, 45123);
  }
}

export default new ElectronMock();
