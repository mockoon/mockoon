import { Express } from 'express';
const adminApiPrefix = '/mockoon-admin';

/*
 * Expose two endpoints to purge the state
 * PURGE /mockoon-admin/state
 * POST /mockoon-admin/state/purge
 *
 * @param app
 * @param statePurgeCallback
 */
const createStateEndpoints = (
  app: Express,
  statePurgeCallback: () => void,
  getglobalVariables: any,
  setGlobalVariables: any,
  purgeGlobalVariables: any
) => {
  const stateEndpoint = `${adminApiPrefix}/state`;
  const purgeHandler = (req, res) => {
    statePurgeCallback();
    res.send({
      response: 'State purged successfully.'
    });
  };

  const setGlobalEnv = (req, res) => {
    
    try {
      
      const { key, value } = req.body;  // Destructure key and value from req.body
      
      if (key && value) {
          setGlobalVariables(key, value); // Set global variables, assume this function is defined properly

          res.send({
              message: `Global variable ${key} has been set to ${value}.`
          });
      } else {
          throw new Error('Key or value missing from request');  // Throw error if key or value are missing
      }
  } catch (err) {
      console.error('Error handling request:', err);
      res.status(400).send({ message: 'Invalid JSON or missing key/value' });
  }
   
  };


  const purgeGlobalEnv = (req, res) => {
    try {
      // Assuming 'helpers' is properly imported or defined elsewhere in your code
      console.log('purging the envs');
      console.log(purgeGlobalVariables());
      res.send({
        message: `Global variables have been purged.`
      });
    } catch (err) {
      console.log(err);
      // Handle any potential errors that might occur when accessing the global variable
      res.status(500).send({ message: 'Failed to retrieve global variable' });
    }
  };


  app.purge(stateEndpoint, purgeHandler);
  app.post(`${stateEndpoint}/purge`, purgeHandler);
  app.post(`${stateEndpoint}/setGlobalVars`, setGlobalEnv);
  app.post(`${stateEndpoint}/purgeGlobalVars`, purgeGlobalEnv);
  
};

/**
 * Create the admin endpoints
 *
 * @param app
 */
export const createAdminEndpoint = (
  app: Express,
  { statePurgeCallback }: { statePurgeCallback: () => void },
  getglobalVariables: any,
  setGlobalVariables: any,
  purgeGlobalVariables: any
) => {
  app.get(adminApiPrefix, (req, res) => {
    res.send({
      response:
        "Welcome to Mockoon's admin API. Check the documentation at https://mockoon.com/docs/latest/admin-api/overview/ for more information."
    });
  });

  createStateEndpoints(app, statePurgeCallback, getglobalVariables, setGlobalVariables, purgeGlobalVariables);
};
