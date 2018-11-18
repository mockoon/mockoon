const Application = require('spectron').Application;
const electronPath = require('electron');
const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');
const http = require('http');

chai.should();
chai.use(chaiAsPromised);

describe('Tests', function () {
  this.timeout(10000);

  before(function () {
    this.app = new Application({
      path: electronPath,
      args: ['./dist', '--tests']
    });

    return this.app.start();
  });

  before(function () {
    chaiAsPromised.transferPromiseness = this.app.transferPromiseness;
  });

  after(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
    return undefined;
  });

  describe('Application', function () {
    it('Open window with Mockoon title', function () {
      return this.app.client.waitUntilWindowLoaded()
        .getWindowCount().should.eventually.equal(1)
        .webContents.getTitle().should.eventually.equal('Mockoon');
    });
  });

  describe('First start', function () {
    it('Show welcome modal', function () {
      return this.app.client.waitUntilTextExists('.modal-title', 'Welcome new Mockoon user!');
    });
    it('Close welcome modal', function () {
      return this.app.client.element('.modal-footer .btn').click().element('.modal-footer .btn');
    });
  });

  describe('Environment', function () {
    it('Start default environment', function () {
      return this.app.client.element('.btn i[ngbtooltip="Start server"]').click();
    });
    it('Call default environment "answer" route', function (done) {
      http.get('http://localhost:3000/answer', (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          body.should.be.equal('42');
          done();
        });
      }).on('error', (error) => {
        done(error);
      });
    });
  });
});
