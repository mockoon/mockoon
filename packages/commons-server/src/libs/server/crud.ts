import { generateUUID, ProcessedDatabucket, Route } from '@mockoon/commons';
import { Request, Response } from 'express';
import { dedupSlashes } from '../utils';

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
  routeCrudKey: Route['crudKey']
) =>
  databucketValue.findIndex((value: any, index: number) => {
    if (typeof value === 'object' && value !== null) {
      if (routeCrudKey == null) {
        return false;
      }

      return value[routeCrudKey].toString() === request.params[routeCrudKey];
    } else {
      let indexParam = parseInt(request.params[routeCrudKey], 10);
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
export const crudRoutesBuilder = (
  routePath: string,
  routeCrudKey: string
): CrudRoutes => {
  const routes: CrudRoutes = [
    { id: 'get', method: 'get', path: `${routePath}` },
    {
      id: 'getbyId',
      method: 'get',
      path: `${routePath}/:${routeCrudKey}`
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
      path: `${routePath}/:${routeCrudKey}`
    },
    {
      id: 'updateMerge',
      method: 'patch',
      path: `${routePath}`
    },
    {
      id: 'updateMergeById',
      method: 'patch',
      path: `${routePath}/:${routeCrudKey}`
    },
    {
      id: 'delete',
      method: 'delete',
      path: `${routePath}`
    },
    {
      id: 'deleteById',
      method: 'delete',
      path: `${routePath}/:${routeCrudKey}`
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
  routeCrudKey: Route['crudKey']
): any => {
  if (databucket.parsed) {
    response.set('Content-Type', 'application/json');
  }

  let requestBody =
    request.body !== undefined ? request.body : request.stringBody || {};

  let responseBody: any = {};

  switch (crudId) {
    case 'get': {
      responseBody = databucket.value;

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

      if (Array.isArray(responseBody)) {
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
          response.set('X-Total-Count', responseBody.length.toString());
          responseBody = responseBody.slice((page - 1) * limit, page * limit);
        }
      }

      break;
    }

    case 'getbyId': {
      if (Array.isArray(databucket.value)) {
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
        if (typeof requestBody === 'object' && requestBody != null) {
          if (routeCrudKey === 'id') {
            requestBody = {
              [routeCrudKey]: generateUUID(),
              ...requestBody
            };
          }
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
            databucket.value[indexToModify] = {
              id: databucket.value[indexToModify].id,
              ...(typeof requestBody === 'object' && requestBody != null
                ? requestBody
                : {})
            };
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
