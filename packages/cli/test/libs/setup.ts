import { stopProcesses } from './helpers';

before('Setup: stop all running processes', () => {
  stopProcesses('all');
});

after('Teardown: stop all running processes', () => {
  stopProcesses('all');
});
