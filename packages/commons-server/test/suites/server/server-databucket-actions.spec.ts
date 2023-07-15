import { generateUUID } from '@mockoon/commons';
import { databucketActions } from '../../../src/libs/server/crud';

const chai = require('chai');
const spies = require('chai-spies');
const expect = chai.expect;

chai.use(spies);

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
      set: () => {},
      status: () => {},
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

    const statusSpy = chai.spy.on(response, 'status');

    databucketActions('create', databucket, request, response, routeCrudKey);

    expect(statusSpy).to.have.been.called.with(201);
    expect(databucket.value[0]).to.have.property('id');
    expect(databucket.value[0]).to.have.property('name');
    expect(databucket.value[0].name).to.deep.equal('John');
  });

  it('should not generate id key if crudkey != "id"', () => {
    request.body = {
      name: 'John',
      uuid: '2c254722-2aaa-4973-a95c-ee4ccf028869'
    };
    routeCrudKey = 'uuid';

    const statusSpy = chai.spy.on(response, 'status');

    databucketActions('create', databucket, request, response, routeCrudKey);

    expect(statusSpy).to.have.been.called.with(201);
    expect(databucket.value[0]).to.not.have.property('id');
    expect(databucket.value[0]).to.deep.equal(request.body);
  });

  it('should set entire request body if databucket.value != []', () => {
    request.body = { name: 'John' };
    databucket.value = null;

    const statusSpy = chai.spy.on(response, 'status');

    databucketActions('create', databucket, request, response, routeCrudKey);

    expect(statusSpy).to.have.been.called.with(201);
    expect(databucket.value).to.be.an('object');
    expect(databucket.value).to.deep.equal(request.body);
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

    expect([responseBody]).to.deep.equal([databucket.value]);
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

    expect(responseBody).to.deep.equal(expectedResponse);
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

    expect(responseBody).to.deep.equal(databucket.value);
  });

  it("should default 'limit' to 10 when it is not a string or not provided", () => {
    for (let i = 0; i < 15; i++) {
      const fakePerson = {
        id: generateUUID(),
        name: 'John'
      };

      databucket.value.push(fakePerson);
    }

    request.query.limit = 24; //non string

    const responseBody = databucketActions(
      'get',
      databucket,
      request,
      response,
      routeCrudKey
    );

    expect(responseBody).to.have.lengthOf(10); // Asserting the default limit of 10
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

    expect(responseBody).to.deep.equal({ id: 2, name: 'Peter' });
  });

  it('should set response status to 404 when the index is not found', () => {
    const data = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Peter' },
      { id: 3, name: 'James' }
    ];
    databucket.value = data;

    response = { status: chai.spy(), set: () => {} };
    const routeCrudKey = 'id';

    request.params = { id: '4' };

    const responseBody = databucketActions(
      'getbyId',
      databucket,
      request,
      response,
      routeCrudKey
    );

    expect(response.status).to.have.been.called.with(404);
    expect(responseBody).to.deep.equal({});
  });

  it('should assign databucket.value to responseBody when databucket.value is not an array', () => {
    databucket.value = { id: 1, name: 'John' };

    response = { status: chai.spy(), set: () => {} };
    const routeCrudKey = 'id';

    request.params = { id: '1' };

    const responseBody = databucketActions(
      'getbyId',
      databucket,
      request,
      response,
      routeCrudKey
    );

    expect(response.status).to.not.have.been.called;
    expect(responseBody).to.deep.equal(databucket.value);
  });

  // Case: Update
  it('should update databucket value and set response status to 200', () => {
    databucket.value = { id: 1, name: 'John Doe' };

    response = { status: chai.spy(), set: () => {} };

    databucket.value = {};

    const responseBody = databucketActions(
      'update',
      databucket,
      request,
      response,
      routeCrudKey
    );

    expect(response.status).to.have.been.called.with(200);
    expect(databucket.value).to.deep.equal(responseBody);
  });

  // Case: updatebyID:
  it('should update databucket value by ID when the index is found', () => {
    const requestBody = { id: 2, name: 'Updated Name' };

    request = { params: { id: '2' }, body: requestBody };
    response = { status: chai.spy(), set: () => {} };
    const routeCrudKey = 'id';

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

    expect(response.status).to.have.been.called.with(200);
    expect(databucket.value).to.deep.equal([
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Updated Name' },
      { id: 3, name: 'Alice Johnson' }
    ]);
    expect(responseBody).to.deep.equal({ id: 2, name: 'Updated Name' });
  });

  it('should set response status to 404 when the index is not found', () => {
    const requestBody = { id: 4, name: 'New Item' };

    request = { params: { id: '4' }, body: requestBody };
    response = { status: chai.spy(), set: () => {} };

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

    expect(response.status).to.have.been.called.with(404);
    expect(databucket.value).to.deep.equal([
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
      { id: 3, name: 'Alice Johnson' }
    ]);
    expect(responseBody).to.deep.equal({});
  });

  it('should update databucket value to the request body when databucket.value is not an array', () => {
    const requestBody = { id: 1, name: 'Updated Name' };

    request = { params: { id: '1' }, body: requestBody };
    response = { status: chai.spy(), set: () => {} };

    databucket.value = { id: 1, name: 'John Doe' };

    const responseBody = databucketActions(
      'updateById',
      databucket,
      request,
      response,
      routeCrudKey
    );

    expect(response.status).to.have.been.called.with(200);
    expect(databucket.value).to.deep.equal({ id: 1, name: 'Updated Name' });
    expect(responseBody).to.deep.equal({ id: 1, name: 'Updated Name' });
  });

  // Case: updateMerge

  it('should merge databucket value with requestBody array when both are arrays', () => {
    request.body = [
      { id: 4, name: 'New Item 1' },
      { id: 5, name: 'New Item 2' }
    ];

    response = { status: chai.spy(), set: () => {} };

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

    expect(response.status).to.have.been.called.with(200);
    expect(databucket.value).to.deep.equal([
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

    response = { status: chai.spy(), set: () => {} };

    databucket.value = { id: 1, name: 'Item 1' };

    databucketActions(
      'updateMerge',
      databucket,
      request,
      response,
      routeCrudKey
    );

    expect(response.status).to.have.been.called.with(200);
    expect(databucket.value).to.deep.equal({
      id: 1,
      name: 'Item 1',
      '0': { id: 4, name: 'New Item 1' },
      '1': { id: 5, name: 'New Item 2' }
    });
  });

  it('should merge databucket value with requestBody object when both are objects', () => {
    request.body = { id: 4, name: 'New Item' };

    response = { status: chai.spy(), set: () => {} };

    databucket.value = { id: 1, name: 'Item 1' };

    databucketActions(
      'updateMerge',
      databucket,
      request,
      response,
      routeCrudKey
    );

    expect(response.status).to.have.been.called.with(200);
    expect(databucket.value).to.deep.equal({
      id: 1,
      name: 'Item 1',
      ...request.body
    });
  });

  it('should update databucket value to the requestBody when databucket.value is not an array or object', () => {
    request.body = { id: 1, name: 'New Item' };

    response = { status: chai.spy(), set: () => {} };

    databucket.value = 'Old Item';

    databucketActions(
      'updateMerge',
      databucket,
      request,
      response,
      routeCrudKey
    );

    expect(response.status).to.have.been.called.with(200);
    expect(databucket.value).to.deep.equal(request.body);
  });

  // Case: updateMergebyId
  it('should update the specific item in the databucket value array when indexToModify is found', () => {
    request.body = { id: 2, name: 'Updated Item' };
    request.params = { id: '2' };
    response = { status: chai.spy(), set: () => {} };

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

    expect(response.status).to.have.been.called.with(200);
    expect(databucket.value).to.deep.equal([
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Updated Item' },
      { id: 3, name: 'Item 3' }
    ]);
  });

  it('should set the response status to 404 when indexToModify is not found in the databucket value array', () => {
    request.body = { id: 4, name: 'New Item' };
    request.params = { id: '4' };
    response = { status: chai.spy(), set: () => {} };

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

    expect(response.status).to.have.been.called.with(404);
    expect(databucket.value).to.deep.equal([
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ]);
  });

  it('should update the databucket value object with the requestBody when databucket.value is an object', () => {
    request.body = { id: 1, name: 'Updated Item' };
    request.params = { id: '1' };
    response = { status: chai.spy(), set: () => {} };

    databucket.value = { id: 1, name: 'Item 1' };

    databucketActions(
      'updateMergeById',
      databucket,
      request,
      response,
      routeCrudKey
    );

    expect(response.status).to.have.been.called.with(200);
    expect(databucket.value).to.deep.equal({ id: 1, name: 'Updated Item' });
  });

  it('should update the databucket value to the requestBody when databucket.value is not an array or object', () => {
    request.body = { id: 1, name: 'New Item' };
    request.param = { id: '1' };
    response = { status: chai.spy(), set: () => {} };

    databucket.value = 'Old Item';

    const responseBody = databucketActions(
      'updateMergeById',
      databucket,
      request,
      response,
      routeCrudKey
    );

    expect(response.status).to.have.been.called.with(200);
    expect(databucket.value).to.deep.equal(request.body);
    expect(responseBody).to.deep.equal(request.body);
  });

  it('should set the databucket value to undefined and set the response status to 200', () => {
    response = { status: chai.spy(), set: () => {} };

    databucket.value = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ];

    databucketActions('delete', databucket, request, response, routeCrudKey);

    expect(databucket.value).to.be.undefined;
    expect(response.status).to.have.been.called.with(200);
  });

  // Case: deletebyID

  it('should set the databucket value to undefined and set the response status to 200 when the databucket value is not an array', () => {
    response = { status: chai.spy(), set: () => {} };

    databucket.value = 'some value';

    const responseBody = databucketActions(
      'deleteById',
      databucket,
      request,
      response,
      routeCrudKey
    );

    expect(databucket.value).to.be.undefined;
    expect(response.status).to.have.been.called.with(200);
  });

  it('should remove the item from the databucket value array at the specified index and set the response status to 200', () => {
    request.params = { id: '2' };
    response = { status: chai.spy(), set: () => {} };

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

    expect(response.status).to.have.been.called.with(200);
    expect(databucket.value).to.deep.equal([
      { id: 1, name: 'Item 1' },
      { id: 3, name: 'Item 3' }
    ]);
    expect(responseBody).to.deep.equal({});
  });

  it('should set the response status to 404 when the index is not found in the databucket value array', () => {
    request = { params: { id: 4 } };
    response = { status: chai.spy(), set: () => {} };

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

    expect(databucket.value).to.deep.equal([
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ]);
    expect(response.status).to.have.been.called.with(404);
    expect(responseBody).to.deep.equal({});
  });
});
