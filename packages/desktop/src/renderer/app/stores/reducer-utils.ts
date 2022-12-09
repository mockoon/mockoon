import {
  Environment,
  GetRouteResponseContentType,
  Route
} from '@mockoon/commons';
import { helpersAutocompletions } from 'src/renderer/app/constants/autocomplete.constant';
import { GetEditorModeFromContentType } from 'src/renderer/app/libs/utils.lib';
import {
  DuplicatedRoutesTypes,
  StoreType
} from 'src/renderer/app/models/store.model';

/**
 * Return a Set of the duplicated route UUIDs in an environment
 *
 * @param environment
 */
const ListDuplicatedRouteUUIDs = (environment: Environment): Set<string> => {
  const duplicates = new Set<string>();

  environment.routes.forEach((route: Route, routeIndex: number) => {
    environment.routes.forEach((otherRoute: Route, otherRouteIndex: number) => {
      if (
        otherRouteIndex > routeIndex &&
        otherRoute.endpoint === route.endpoint &&
        otherRoute.method === route.method
      ) {
        duplicates.add(otherRoute.uuid);
      }
    });
  });

  return duplicates;
};

/**
 * Return the body editor "mode" from the currently selected env / route response
 *
 * @param state
 */
export const getBodyEditorMode = (state: StoreType) => {
  const currentEnvironment = state.environments.find(
    (environment) => environment.uuid === state.activeEnvironmentUUID
  );
  const currentRoute =
    currentEnvironment &&
    currentEnvironment.routes.find(
      (route) => route.uuid === state.activeRouteUUID
    );
  const currentRouteResponse =
    currentEnvironment &&
    currentRoute &&
    currentRoute.responses.find(
      (response) => response.uuid === state.activeRouteResponseUUID
    );

  if (!currentEnvironment || !currentRoute || !currentRouteResponse) {
    return 'text';
  }

  const routeResponseContentType = GetRouteResponseContentType(
    currentEnvironment,
    currentRouteResponse
  );

  return GetEditorModeFromContentType(routeResponseContentType);
};

/**
 * List duplicated routes per environment (sharing same endpoint and method)
 *
 * @param state
 */
export const updateDuplicatedRoutes = (
  state: StoreType
): DuplicatedRoutesTypes => {
  const duplicatedRoutes: DuplicatedRoutesTypes = {};

  state.environments.forEach((environment) => {
    duplicatedRoutes[environment.uuid] = ListDuplicatedRouteUUIDs(environment);
  });

  return duplicatedRoutes;
};

/**
 * Move an object value from one key to another, and remove the old one.
 * Usefull when an environment UUID changes.
 *
 * @param previousKey
 * @param currentKey
 * @param target
 */
export const changeObjectKey = (
  previousKey: string,
  currentKey: string,
  target: { [key in string]: any }
) => {
  target[currentKey] = target[previousKey];
  delete target[previousKey];
};

/**
 * Create the editor autocomplete list from the current environment data buckets and helpers list
 *
 * @param state
 * @returns
 */
export const updateEditorAutocomplete = (state: StoreType) => {
  const currentEnvironment = state.environments.find(
    (environment) => environment.uuid === state.activeEnvironmentUUID
  );
  if (currentEnvironment) {
    const autoCompletions = [];
    currentEnvironment.data.forEach((databucket) => {
      autoCompletions.push(
        {
          caption: `data '${databucket.id}'`,
          value: `{{data '${databucket.id}'}}`,
          meta: `${databucket.name}`
        },
        {
          caption: `dataRaw '${databucket.id}'`,
          value: `{{dataRaw '${databucket.id}'}}`,
          meta: `${databucket.name}`
        }
      );
    });

    return [
      {
        getCompletions: (editor, session, pos, prefix, callback) => {
          callback(null, [...autoCompletions, ...helpersAutocompletions]);
        }
      }
    ];
  }

  return [];
};
