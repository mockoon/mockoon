import {
  generateUUID,
  ProcessedDatabucket,
  RouteResponse
} from '@mockoon/commons';
import { Request, Response } from 'express';
import { get as getPath, set as setPath } from 'object-path';
import { applyFilter, parseFilters } from '../filters';
import { convertPathToArray, dedupSlashes, fullTextSearch } from '../utils';

export type CrudRouteIds =
  | 'get'
  | 'getbyId'
  | 'create'
  | 'update'
  | 'updateById'
  | 'updateMerge'
  | 'updateMergeById'
  | 'delete'
  | 'deleteById';

type CrudRoutes = {
  id: CrudRouteIds;
  method: string;
  path: string;
}[];

export const crudRouteParamName = 'id';

/**
 * Find an item by its id in an array of objects or by its index in an array of primitives
 *
 * @param databucketValue
 * @param request
 * @returns
 */
const findItemIndex = (
  databucketValue: any,
  request: Request,
  routeCrudKey: RouteResponse['crudKey']
) =>
  databucketValue.findIndex((value: any, index: number) => {
    if (typeof value === 'object' && value !== null) {
      if (getPath(value, routeCrudKey) == null) {
        return false;
      }

      return getPath(value, routeCrudKey).toString() === request.params.id;
    } else {
      let indexParam = parseInt(request.params.id, 10);
      indexParam = isNaN(indexParam) ? 0 : indexParam;

      return indexParam === index;
    }
  });

/**
 * Creates a set of CRUD routes for a given route path
 *
 * @param routePath
 * @returns
 */
export const crudRoutesBuilder = (routePath: string): CrudRoutes => {
  const routes: CrudRoutes = [
    { id: 'get', method: 'get', path: `${routePath}` },
    {
      id: 'getbyId',
      method: 'get',
      path: `${routePath}/:id`
    },
    { id: 'create', method: 'post', path: `${routePath}` },
    {
      id: 'update',
      method: 'put',
      path: `${routePath}`
    },
    {
      id: 'updateById',
      method: 'put',
      path: `${routePath}/:id`
    },
    {
      id: 'updateMerge',
      method: 'patch',
      path: `${routePath}`
    },
    {
      id: 'updateMergeById',
      method: 'patch',
      path: `${routePath}/:id`
    },
    {
      id: 'delete',
      method: 'delete',
      path: `${routePath}`
    },
    {
      id: 'deleteById',
      method: 'delete',
      path: `${routePath}/:id`
    }
  ];

  // deduplicate slashes as we may get a routePath containing a leading slash
  for (const route of routes) {
    route.path = dedupSlashes(route.path);
  }

  return routes;
};

/**
 * Creates a set of CRUD actions for a given databucket type
 */
export const databucketActions = (
  crudId: CrudRouteIds,
  databucket: ProcessedDatabucket,
  request: Request,
  response: Response,
  routeCrudKey: RouteResponse['crudKey']
): any => {
  if (databucket.parsed) {
    response.set('Content-Type', 'application/json');
  }

  const requestBody =
    request.body !== undefined ? request.body : request.stringBody || {};

  let responseBody: any = {};

  switch (crudId) {
    case 'get': {
      responseBody = databucket.value;

      const search =
        typeof request.query.search === 'string' && request.query.search
          ? request.query.search
          : null;
      const limit =
        typeof request.query.limit === 'string'
          ? parseInt(request.query.limit, 10) || 10
          : 10;
      const page =
        typeof request.query.page === 'string'
          ? parseInt(request.query.page, 10) || 1
          : 1;
      const sort =
        typeof request.query.sort === 'string' ? request.query.sort : null;
      const order =
        typeof request.query.order === 'string'
          ? ['asc', 'desc'].includes(request.query.order)
            ? request.query.order
            : 'asc'
          : 'asc';
      const filters = parseFilters(request.query);

      if (Array.isArray(responseBody)) {
        response.set('X-Total-Count', responseBody.length.toString());

        if (search != null) {
          responseBody = responseBody.filter((r) => fullTextSearch(r, search));
        }

        responseBody = responseBody.filter((r) =>
          filters.every((f) => applyFilter(r, f))
        );
        response.set('X-Filtered-Count', responseBody.length.toString());

        if (sort != null) {
          responseBody = responseBody.slice().sort((a, b) => {
            let aProp = typeof a === 'object' && a !== null ? a[sort] : a;
            let bProp = typeof b === 'object' && b !== null ? b[sort] : b;

            aProp = typeof aProp === 'string' ? aProp.toLowerCase() : aProp;
            bProp = typeof bProp === 'string' ? bProp.toLowerCase() : bProp;

            if (aProp < bProp) {
              return order === 'asc' ? -1 : 1;
            }

            if (aProp > bProp) {
              return order === 'asc' ? 1 : -1;
            }

            return 0;
          });
        }

        if (
          request.query.limit !== undefined ||
          request.query.page !== undefined
        ) {
          responseBody = responseBody.slice((page - 1) * limit, page * limit);
        }
      }

      break;
    }

    case 'getbyId': {
      if (Array.isArray(databucket.value)) {
        console.log(routeCrudKey);
        const foundIndex = findItemIndex(
          databucket.value,
          request,
          routeCrudKey
        );

        if (foundIndex !== -1) {
          responseBody = databucket.value[foundIndex];
        } else {
          response.status(404);
        }
      } else {
        responseBody = databucket.value;
      }
      break;
    }

    case 'create': {
      if (Array.isArray(databucket.value)) {
        // add missing id if not present, support nested objects (e.g. 'data.id')
        if (
          typeof requestBody === 'object' &&
          requestBody != null &&
          getPath(requestBody, convertPathToArray(routeCrudKey)) === undefined
        ) {
          // get highest id in the array
          const highestId = databucket.value.reduce((maxId, item) => {
            const itemId = getPath(item, convertPathToArray(routeCrudKey));

            if (typeof itemId === 'number' && itemId > maxId) {
              return itemId;
            }

            return maxId;
          }, null);

          setPath(
            requestBody,
            convertPathToArray(routeCrudKey),
            highestId !== null ? highestId + 1 : generateUUID()
          );
        }

        databucket.value.push(requestBody);
      } else {
        databucket.value = requestBody;
      }

      response.status(201);

      responseBody = requestBody;
      break;
    }

    case 'update': {
      databucket.value = requestBody;
      responseBody = databucket.value;
      response.status(200);
      break;
    }

    case 'updateById': {
      if (Array.isArray(databucket.value)) {
        const indexToModify = findItemIndex(
          databucket.value,
          request,
          routeCrudKey
        );

        if (indexToModify !== -1) {
          if (
            typeof databucket.value[indexToModify] === 'object' &&
            databucket.value[indexToModify] != null
          ) {
            const currentItemId = getPath(
              databucket.value[indexToModify],
              convertPathToArray(routeCrudKey)
            );

            databucket.value[indexToModify] = {
              ...(typeof requestBody === 'object' && requestBody != null
                ? requestBody
                : {})
            };

            // restore the id if it was not provided in the request body
            if (
              getPath(requestBody, convertPathToArray(routeCrudKey)) ===
              undefined
            ) {
              setPath(
                databucket.value[indexToModify],
                convertPathToArray(routeCrudKey),
                currentItemId
              );
            }

            responseBody = databucket.value[indexToModify];
          } else {
            databucket.value[indexToModify] = requestBody;
            responseBody = databucket.value[indexToModify];
          }

          response.status(200);
        } else {
          response.status(404);
        }
      } else {
        databucket.value = requestBody;
        responseBody = databucket.value;
        response.status(200);
      }
      break;
    }

    case 'updateMerge': {
      if (Array.isArray(databucket.value) && Array.isArray(requestBody)) {
        databucket.value = databucket.value.concat(requestBody);
        responseBody = databucket.value;
        response.status(200);
      } else {
        databucket.value =
          typeof databucket.value === 'object' && databucket.value != null
            ? {
                ...databucket.value,
                ...(typeof requestBody === 'object' && requestBody != null
                  ? requestBody
                  : {})
              }
            : requestBody;

        responseBody = databucket.value;
        response.status(200);
      }
      break;
    }

    case 'updateMergeById': {
      if (Array.isArray(databucket.value)) {
        const indexToModify = findItemIndex(
          databucket.value,
          request,
          routeCrudKey
        );

        if (indexToModify !== -1) {
          databucket.value[indexToModify] =
            typeof databucket.value[indexToModify] === 'object' &&
            databucket.value[indexToModify] != null
              ? {
                  ...databucket.value[indexToModify],
                  ...(typeof requestBody === 'object' && requestBody != null
                    ? requestBody
                    : {})
                }
              : requestBody;
          responseBody = databucket.value[indexToModify];
          response.status(200);
        } else {
          response.status(404);
        }
      } else {
        databucket.value =
          typeof databucket.value === 'object' && databucket.value != null
            ? {
                ...databucket.value,
                ...(typeof requestBody === 'object' && requestBody != null
                  ? requestBody
                  : {})
              }
            : requestBody;

        responseBody = databucket.value;
        response.status(200);
      }
      break;
    }

    case 'delete': {
      databucket.value = undefined;

      response.status(200);

      break;
    }

    case 'deleteById': {
      if (Array.isArray(databucket.value)) {
        const indexToDelete = findItemIndex(
          databucket.value,
          request,
          routeCrudKey
        );

        if (indexToDelete === -1) {
          response.status(404);
        } else {
          databucket.value.splice(indexToDelete, 1);
          response.status(200);
        }
      } else {
        databucket.value = undefined;

        response.status(200);
      }
      break;
    }
  }

  return responseBody;
};
