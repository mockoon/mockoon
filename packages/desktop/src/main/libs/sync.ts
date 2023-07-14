import { app } from 'electron';
import { join as pathJoin } from 'path';
/* const ReconnectingWebSocket = require('reconnecting-websocket');
const Connection = require('sharedb/lib/client').Connection;

const socket = new ReconnectingWebSocket('ws://localhost:5010');
const connection = new Connection(socket); */

//const doc = connection.get('sync-files', 'uuid');

const logPrefix = '[MAIN][SYNC] ';

// TODO sync files will be hooked to memfs
const getSyncRepoDir = () => pathJoin(app.getPath('userData'), 'sync-files');
const getHiddenGitDir = () => pathJoin(app.getPath('userData'), 'sync');

/**
 * Initialize the data synchronization by cloning the distant repository in the application storage
 */
export const initSync = async () => {};

export const updateEnvironments = (files: File[], path: string) => {};
