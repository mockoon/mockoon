import { generateUUID } from '@mockoon/commons';
import { deepStrictEqual, notStrictEqual, ok, strictEqual } from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import { databucketActions } from '../../../src/libs/server/crud';

describe('Databucket Actions', () => {
  let databucket;
  let request;
  let response;
  let routeCrudKey;

  beforeEach(() => {
    databucket = {
      parsed: true,
      value: []
    };
    request = { body: {}, query: {}, params: {} };
    response = {
      set: () => {
        // empty
      },
      status: () => {
        // empty
      },
      body: {},
      query: null
    };
    routeCrudKey = 'id';
  });

  afterEach(() => {
    databucket = null;
    request = null;
    response = null;
    routeCrudKey = null;
  });

  // Case: create

  it('should push request body to databucket in create case and generates ID', () => {
    request.body = { name: 'John' };

    mock.method(response, 'status');

    databucketActions('create', databucket, request, response, routeCrudKey);

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(statusSpy.arguments, [201]);
    notStrictEqual(databucket.value[0].id, undefined);
    notStrictEqual(databucket.value[0].name, undefined);
    strictEqual(databucket.value[0].name, 'John');
  });

  it('should not generate id key if crudkey != "id"', () => {
    request.body = {
      name: 'John',
      uuid: '2c254722-2aaa-4973-a95c-ee4ccf028869'
    };
    routeCrudKey = 'uuid';

    mock.method(response, 'status');

    databucketActions('create', databucket, request, response, routeCrudKey);

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(statusSpy.arguments, [201]);
    strictEqual(databucket.value[0].id, undefined);
    deepStrictEqual(databucket.value[0], request.body);
  });

  it('should set entire request body if databucket.value != []', () => {
    request.body = { name: 'John' };
    databucket.value = null;

    mock.method(response, 'status');

    databucketActions('create', databucket, request, response, routeCrudKey);

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(statusSpy.arguments, [201]);
    ok(typeof databucket.value === 'object');
    deepStrictEqual(databucket.value, request.body);
  });

  it('should assign responseBody to databucket.value', () => {
    databucket.value = {
      uuid: '2c254722-2aaa-4973-a95c-ee4ccf028869',
      foo: 'bar',
      hi: 'goodbye'
    };
    routeCrudKey = 'uuid';

    const responseBody = databucketActions(
      'create',
      databucket,
      request,
      response,
      routeCrudKey
    );

    deepStrictEqual([responseBody], [databucket.value]);
  });

  // Case: get

  it('should sort and paginate the response array when responseBody is an array', () => {
    databucket.value = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
      { id: 3, name: 'Alice' },
      { id: 4, name: 'Bob' },
      { id: 5, name: 'Eve' }
    ];

    request.query = {
      limit: '2',
      page: '2',
      sort: 'name',
      order: 'desc'
    };

    const expectedResponse = [
      { id: 5, name: 'Eve' },
      { id: 4, name: 'Bob' }
    ];

    const responseBody = databucketActions(
      'get',
      databucket,
      request,
      response,
      routeCrudKey
    );

    deepStrictEqual(responseBody, expectedResponse);
  });

  it('should not modify response body when it is not an array', () => {
    databucket.value = { id: 1, name: 'John' };

    const responseBody = databucketActions(
      'get',
      databucket,
      request,
      response,
      routeCrudKey
    );

    deepStrictEqual(responseBody, databucket.value);
  });

  it("should default 'limit' to 10 when it is not a string or not provided", () => {
    for (let i = 0; i < 15; i++) {
      const fakePerson = {
        id: generateUUID(),
        name: 'John'
      };

      databucket.value.push(fakePerson);
    }

    request.query.limit = 24;

    const responseBody = databucketActions(
      'get',
      databucket,
      request,
      response,
      routeCrudKey
    );

    strictEqual(responseBody.length, 10);
  });

  // Case: get by ID:
  it('should set responseBody to the found object when the array is not empty and the index is found', () => {
    databucket.value = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Peter' },
      { id: 3, name: 'James' }
    ];

    request.params = { id: '2' };

    const responseBody = databucketActions(
      'getbyId',
      databucket,
      request,
      response,
      routeCrudKey
    );

    deepStrictEqual(responseBody, { id: 2, name: 'Peter' });
  });

  it('should set response status to 404 when the index is not found', () => {
    const data = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Peter' },
      { id: 3, name: 'James' }
    ];
    databucket.value = data;

    mock.method(response, 'status');

    request.params = { id: '4' };

    const responseBody = databucketActions(
      'getbyId',
      databucket,
      request,
      response,
      routeCrudKey
    );

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(statusSpy.arguments, [404]);
    deepStrictEqual(responseBody, {});
  });

  it('should assign databucket.value to responseBody when databucket.value is not an array', () => {
    databucket.value = { id: 1, name: 'John' };

    mock.method(response, 'status');

    request.params = { id: '1' };

    const responseBody = databucketActions(
      'getbyId',
      databucket,
      request,
      response,
      routeCrudKey
    );

    const statusSpy = response.status.mock.calls;

    strictEqual(statusSpy.length, 0);
    deepStrictEqual(responseBody, databucket.value);
  });

  // Case: Update
  it('should update databucket value and set response status to 200', () => {
    databucket.value = { id: 1, name: 'John Doe' };

    mock.method(response, 'status');

    databucket.value = {};

    const responseBody = databucketActions(
      'update',
      databucket,
      request,
      response,
      routeCrudKey
    );

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(statusSpy.arguments, [200]);
    deepStrictEqual(databucket.value, responseBody);
  });

  // Case: updatebyID:
  it('should update databucket value by ID when the index is found', () => {
    const requestBody = { id: 2, name: 'Updated Name' };

    request = { params: { id: '2' }, body: requestBody };

    mock.method(response, 'status');

    databucket.value = [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
      { id: 3, name: 'Alice Johnson' }
    ];

    const responseBody = databucketActions(
      'updateById',
      databucket,
      request,
      response,
      routeCrudKey
    );

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(statusSpy.arguments, [200]);
    deepStrictEqual(databucket.value, [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Updated Name' },
      { id: 3, name: 'Alice Johnson' }
    ]);
    deepStrictEqual(responseBody, { id: 2, name: 'Updated Name' });
  });

  it('should set response status to 404 when the index is not found', () => {
    const requestBody = { id: 4, name: 'New Item' };

    request = { params: { id: '4' }, body: requestBody };

    mock.method(response, 'status');

    databucket.value = [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
      { id: 3, name: 'Alice Johnson' }
    ];

    const responseBody = databucketActions(
      'updateById',
      databucket,
      request,
      response,
      routeCrudKey
    );

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(statusSpy.arguments, [404]);
    deepStrictEqual(databucket.value, [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
      { id: 3, name: 'Alice Johnson' }
    ]);
    deepStrictEqual(responseBody, {});
  });

  it('should update databucket value to the request body when databucket.value is not an array', () => {
    const requestBody = { id: 1, name: 'Updated Name' };

    request = { params: { id: '1' }, body: requestBody };

    mock.method(response, 'status');

    databucket.value = { id: 1, name: 'John Doe' };

    const responseBody = databucketActions(
      'updateById',
      databucket,
      request,
      response,
      routeCrudKey
    );

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(statusSpy.arguments, [200]);
    deepStrictEqual(databucket.value, { id: 1, name: 'Updated Name' });
    deepStrictEqual(responseBody, { id: 1, name: 'Updated Name' });
  });

  // Case: updateMerge

  it('should merge databucket value with requestBody array when both are arrays', () => {
    request.body = [
      { id: 4, name: 'New Item 1' },
      { id: 5, name: 'New Item 2' }
    ];

    mock.method(response, 'status');

    databucket.value = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ];

    databucketActions(
      'updateMerge',
      databucket,
      request,
      response,
      routeCrudKey
    );

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(statusSpy.arguments, [200]);
    deepStrictEqual(databucket.value, [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
      { id: 4, name: 'New Item 1' },
      { id: 5, name: 'New Item 2' }
    ]);
  });

  it('should merge databucket value with requestBody array when databucket.value is an object and requestBody is an array', () => {
    request.body = [
      { id: 4, name: 'New Item 1' },
      { id: 5, name: 'New Item 2' }
    ];

    mock.method(response, 'status');

    databucket.value = { id: 1, name: 'Item 1' };

    databucketActions(
      'updateMerge',
      databucket,
      request,
      response,
      routeCrudKey
    );

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(statusSpy.arguments, [200]);
    deepStrictEqual(databucket.value, {
      id: 1,
      name: 'Item 1',
      '0': { id: 4, name: 'New Item 1' },
      '1': { id: 5, name: 'New Item 2' }
    });
  });

  it('should merge databucket value with requestBody object when both are objects', () => {
    request.body = { id: 4, name: 'New Item' };

    mock.method(response, 'status');

    databucket.value = { id: 1, name: 'Item 1' };

    databucketActions(
      'updateMerge',
      databucket,
      request,
      response,
      routeCrudKey
    );

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(statusSpy.arguments, [200]);
    deepStrictEqual(databucket.value, {
      id: 1,
      name: 'Item 1',
      ...request.body
    });
  });

  it('should update databucket value to the requestBody when databucket.value is not an array or object', () => {
    request.body = { id: 1, name: 'New Item' };

    mock.method(response, 'status');

    databucket.value = 'Old Item';

    databucketActions(
      'updateMerge',
      databucket,
      request,
      response,
      routeCrudKey
    );

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(statusSpy.arguments, [200]);
    deepStrictEqual(databucket.value, request.body);
  });

  // Case: updateMergebyId
  it('should update the specific item in the databucket value array when indexToModify is found', () => {
    request.body = { id: 2, name: 'Updated Item' };
    request.params = { id: '2' };

    mock.method(response, 'status');

    databucket.value = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ];

    databucketActions(
      'updateMergeById',
      databucket,
      request,
      response,
      routeCrudKey
    );

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(statusSpy.arguments, [200]);
    deepStrictEqual(databucket.value, [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Updated Item' },
      { id: 3, name: 'Item 3' }
    ]);
  });

  it('should set the response status to 404 when indexToModify is not found in the databucket value array', () => {
    request.body = { id: 4, name: 'New Item' };
    request.params = { id: '4' };

    mock.method(response, 'status');

    databucket.value = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ];

    databucketActions(
      'updateMergeById',
      databucket,
      request,
      response,
      routeCrudKey
    );

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(statusSpy.arguments, [404]);
    deepStrictEqual(databucket.value, [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ]);
  });

  it('should update the databucket value object with the requestBody when databucket.value is an object', () => {
    request.body = { id: 1, name: 'Updated Item' };
    request.params = { id: '1' };

    mock.method(response, 'status');

    databucket.value = { id: 1, name: 'Item 1' };

    databucketActions(
      'updateMergeById',
      databucket,
      request,
      response,
      routeCrudKey
    );

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(statusSpy.arguments, [200]);
    deepStrictEqual(databucket.value, { id: 1, name: 'Updated Item' });
  });

  it('should update the databucket value to the requestBody when databucket.value is not an array or object', () => {
    request.body = { id: 1, name: 'New Item' };
    request.param = { id: '1' };
    mock.method(response, 'status');

    databucket.value = 'Old Item';

    const responseBody = databucketActions(
      'updateMergeById',
      databucket,
      request,
      response,
      routeCrudKey
    );

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(statusSpy.arguments, [200]);
    deepStrictEqual(databucket.value, request.body);
    deepStrictEqual(responseBody, request.body);
  });

  it('should set the databucket value to undefined and set the response status to 200', () => {
    mock.method(response, 'status');

    databucket.value = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ];

    databucketActions('delete', databucket, request, response, routeCrudKey);

    const statusSpy = response.status.mock.calls[0];

    strictEqual(databucket.value, undefined);
    deepStrictEqual(statusSpy.arguments, [200]);
  });

  // Case: deletebyID

  it('should set the databucket value to undefined and set the response status to 200 when the databucket value is not an array', () => {
    mock.method(response, 'status');

    databucket.value = 'some value';

    databucketActions(
      'deleteById',
      databucket,
      request,
      response,
      routeCrudKey
    );

    const statusSpy = response.status.mock.calls[0];

    strictEqual(databucket.value, undefined);
    deepStrictEqual(statusSpy.arguments, [200]);
  });

  it('should remove the item from the databucket value array at the specified index and set the response status to 200', () => {
    request.params = { id: '2' };
    mock.method(response, 'status');

    databucket.value = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ];

    const responseBody = databucketActions(
      'deleteById',
      databucket,
      request,
      response,
      routeCrudKey
    );

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(statusSpy.arguments, [200]);
    deepStrictEqual(databucket.value, [
      { id: 1, name: 'Item 1' },
      { id: 3, name: 'Item 3' }
    ]);
    deepStrictEqual(responseBody, {});
  });

  it('should set the response status to 404 when the index is not found in the databucket value array', () => {
    request = { params: { id: 4 } };
    mock.method(response, 'status');

    databucket.value = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ];

    const responseBody = databucketActions(
      'deleteById',
      databucket,
      request,
      response,
      routeCrudKey
    );

    const statusSpy = response.status.mock.calls[0];

    deepStrictEqual(databucket.value, [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ]);

    deepStrictEqual(statusSpy.arguments, [404]);
    deepStrictEqual(responseBody, {});
  });
});
