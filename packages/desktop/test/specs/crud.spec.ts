import environments from '../libs/environments';
import http from '../libs/http';
import { HttpCall } from '../libs/models';
import routes from '../libs/routes';

const jsonArrayTestGroups: HttpCall[][] = [
  [
    {
      description: 'Users bucket - get',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[{"id":"abcd","name":"john"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '1',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - getById',
      path: '/users/abcd',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '{"id":"abcd","name":"john"}',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - getById: wrong id',
      path: '/users/abcde',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 404,
        body: '{}',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - create: empty body',
      path: '/users',
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: /\{"id":"[a-z0-9-]{36}"\}/,
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after create',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: /\[\{"id":"abcd","name":"john"\},\{"id":"[a-z0-9-]{36}"\}\]/,
        headers: {
          'content-type': 'application/json',
          'x-total-count': '2',
          'x-filtered-count': '2'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - create: empty object',
      path: '/users',
      method: 'POST',
      body: {},
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: /\{"id":"[a-z0-9-]{36}"\}/,
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after create',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: /\[\{"id":"abcd","name":"john"\},\{"id":"[a-z0-9-]{36}"\}\]/,
        headers: {
          'content-type': 'application/json',
          'x-total-count': '2',
          'x-filtered-count': '2'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - create: object without id',
      path: '/users',
      method: 'POST',
      body: { test: 'hello' },
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: /\{"test":"hello","id":"[a-z0-9-]{36}"\}/,
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after create',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: /\[\{"id":"abcd","name":"john"\},\{"test":"hello","id":"[a-z0-9-]{36}"\}\]/,
        headers: {
          'content-type': 'application/json',
          'x-total-count': '2',
          'x-filtered-count': '2'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - create: object with id',
      path: '/users',
      method: 'POST',
      body: { id: 'idtest', test: 'hello' },
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: '{"id":"idtest","test":"hello"}',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after create',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[{"id":"abcd","name":"john"},{"id":"idtest","test":"hello"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '2',
          'x-filtered-count': '2'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - create: string',
      path: '/users',
      method: 'POST',
      body: 'teststring',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: 'teststring',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after create',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[{"id":"abcd","name":"john"},"teststring"]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '2',
          'x-filtered-count': '2'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - create: unparseable JSON',
      path: '/users',
      method: 'POST',
      body: 'test,string',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: 'test,string',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after create',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[{"id":"abcd","name":"john"},"test,string"]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '2',
          'x-filtered-count': '2'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update: incorrect id',
      path: '/users/abcde',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 404,
        body: '{}',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update: no body',
      path: '/users/abcd',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '{"id":"abcd"}',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after update',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[{"id":"abcd"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '1',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update: empty object',
      path: '/users/abcd',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: {},
      testedResponse: {
        status: 200,
        body: '{"id":"abcd"}',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after update',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[{"id":"abcd"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '1',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update: object, new prop, no id',
      path: '/users/abcd',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: { test: 'hello' },
      testedResponse: {
        status: 200,
        body: '{"test":"hello","id":"abcd"}',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after update',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[{"test":"hello","id":"abcd"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '1',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update: object, new prop, id',
      path: '/users/abcd',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: { id: 'efgh', test: 'hello' },
      testedResponse: {
        status: 200,
        body: '{"id":"efgh","test":"hello"}',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after update',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[{"id":"efgh","test":"hello"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '1',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update: object, string',
      path: '/users/abcd',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: 'teststring',
      testedResponse: {
        status: 200,
        body: '{"id":"abcd"}',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after update',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[{"id":"abcd"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '1',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update: object, broken json',
      path: '/users/abcd',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: 'test,string',
      testedResponse: {
        status: 200,
        body: '{"id":"abcd"}',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after update',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[{"id":"abcd"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '1',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - full update',
      path: '/users',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: [{ id: 'efgh', test: 'hello' }],
      testedResponse: {
        status: 200,
        body: '[{"id":"efgh","test":"hello"}]',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after full update',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[{"id":"efgh","test":"hello"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '1',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update (merge): incorrect id',
      path: '/users/abcde',
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 404,
        body: '{}',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update (merge): empty object body',
      path: '/users/abcd',
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: {},
      testedResponse: {
        status: 200,
        body: '{"id":"abcd","name":"john"}',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after update (merge)',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[{"id":"abcd","name":"john"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '1',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update (merge): object body',
      path: '/users/abcd',
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: { test: 'hello' },
      testedResponse: {
        status: 200,
        body: '{"id":"abcd","name":"john","test":"hello"}',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after update (merge)',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[{"id":"abcd","name":"john","test":"hello"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '1',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update (merge): string',
      path: '/users/abcd',
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: 'teststring',
      testedResponse: {
        status: 200,
        body: '{"id":"abcd","name":"john"}',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after update (merge)',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[{"id":"abcd","name":"john"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '1',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update (merge): broken json',
      path: '/users/abcd',
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: 'test,string',
      testedResponse: {
        status: 200,
        body: '{"id":"abcd","name":"john"}',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after update (merge)',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[{"id":"abcd","name":"john"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '1',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - numeric ids - create: object without id',
      path: '/users-numeric',
      method: 'POST',
      body: { test: 'hello' },
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: /\{"test":"hello","id":6\}/,
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - numeric ids - get: after create',
      path: '/users-numeric',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: /\[\{"id":5,"name":"peter"\},\{"test":"hello","id":6\}\]/,
        headers: {
          'content-type': 'application/json',
          'x-total-count': '2',
          'x-filtered-count': '2'
        }
      }
    },
    {
      description: 'Users bucket - numeric ids - create: object with string id',
      path: '/users-numeric',
      method: 'POST',
      body: { id: 'newid', test: 'hello2' },
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: /\{"id":\"newid\","test":"hello2"\}/,
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - numeric ids - get: after create',
      path: '/users-numeric',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: /\[\{"id":5,"name":"peter"\},\{"test":"hello","id":6\},\{"id":"newid","test":"hello2"\}\]/,
        headers: {
          'content-type': 'application/json',
          'x-total-count': '3',
          'x-filtered-count': '3'
        }
      }
    },
    {
      description: 'Users bucket - numeric ids - create: object without id',
      path: '/users-numeric',
      method: 'POST',
      body: { test: 'hello3' },
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: /\{"test":"hello3","id":7\}/,
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - numeric ids - delete item 1',
      path: '/users-numeric/5',
      method: 'DELETE',
      testedResponse: {
        status: 200
      }
    },
    {
      description: 'Users bucket - numeric ids - delete item 2',
      path: '/users-numeric/6',
      method: 'DELETE',
      testedResponse: {
        status: 200
      }
    },
    {
      description: 'Users bucket - numeric ids - delete item 3',
      path: '/users-numeric/7',
      method: 'DELETE',
      testedResponse: {
        status: 200
      }
    },
    {
      description: 'Users bucket - numeric ids - delete item 4',
      path: '/users-numeric/newid',
      method: 'DELETE',
      testedResponse: {
        status: 200
      }
    },
    {
      description: 'Users bucket - numeric ids - create: object without id',
      path: '/users-numeric',
      method: 'POST',
      body: { test: 'hello1' },
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: /\{"test":"hello1","id":"[a-z0-9-]{36}"\}/,
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description:
        'Users bucket - numeric ids - create: object with numeric id',
      path: '/users-numeric',
      method: 'POST',
      body: { id: 3, test: 'hello2' },
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: /\{"id":3,"test":"hello2"\}/,
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - numeric ids - create: object without id',
      path: '/users-numeric',
      method: 'POST',
      body: { test: 'hello3' },
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: /\{"test":"hello3","id":4\}/,
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - numeric ids - get: after create',
      path: '/users-numeric',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: /\[\{"test":"hello1","id":"[a-z0-9-]{36}"\},\{"id":3,"test":"hello2"\},\{"test":"hello3","id":4\}\]/,
        headers: {
          'content-type': 'application/json',
          'x-total-count': '3',
          'x-filtered-count': '3'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - full update (merge)',
      path: '/users',
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: [{ id: 'efgh', test: 'hello' }],
      testedResponse: {
        status: 200,
        body: '[{"id":"abcd","name":"john"},{"id":"efgh","test":"hello"}]',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after full update (merge)',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[{"id":"abcd","name":"john"},{"id":"efgh","test":"hello"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '2',
          'x-filtered-count': '2'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - delete: incorrect id',
      path: '/users/abcde',
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 404,
        body: '{}',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - delete',
      path: '/users/abcd',
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '{}',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after delete',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '0',
          'x-filtered-count': '0'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - full delete',
      path: '/users',
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '{}',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Users bucket - get: after full delete',
      path: '/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Pagination bucket - get all',
      path: '/pagination',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":1,"username":"peter"},{"id":2,"username":"alberto"},{"id":3,"username":"marta"},{"id":4,"username":"mary"},{"id":5,"username":"john"},{"id":6,"username":"douglas"},{"id":7,"username":"paul"},{"id":8,"username":"paula"},{"id":9,"username":"theresa"},{"id":10,"username":"cinderella"},{"id":11,"username":"laura"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '11'
        }
      }
    },
    {
      description: 'Pagination bucket - get limit 5',
      path: '/pagination?limit=5',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":1,"username":"peter"},{"id":2,"username":"alberto"},{"id":3,"username":"marta"},{"id":4,"username":"mary"},{"id":5,"username":"john"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '11'
        }
      }
    },
    {
      description: 'Pagination bucket - get page 1 (default limit 10)',
      path: '/pagination?page=1',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":1,"username":"peter"},{"id":2,"username":"alberto"},{"id":3,"username":"marta"},{"id":4,"username":"mary"},{"id":5,"username":"john"},{"id":6,"username":"douglas"},{"id":7,"username":"paul"},{"id":8,"username":"paula"},{"id":9,"username":"theresa"},{"id":10,"username":"cinderella"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '11'
        }
      }
    },
    {
      description: 'Pagination bucket - get page 2, limit 5',
      path: '/pagination?page=2&limit=5',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":6,"username":"douglas"},{"id":7,"username":"paul"},{"id":8,"username":"paula"},{"id":9,"username":"theresa"},{"id":10,"username":"cinderella"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '11'
        }
      }
    },
    {
      description:
        'Pagination bucket - sort username (default asc), get page 2, limit 5',
      path: '/pagination?sort=username&page=2&limit=5',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":3,"username":"marta"},{"id":4,"username":"mary"},{"id":7,"username":"paul"},{"id":8,"username":"paula"},{"id":1,"username":"peter"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '11'
        }
      }
    },
    {
      description:
        'Pagination bucket - sort username desc, get page 2, limit 5',
      path: '/pagination?sort=username&order=desc&page=2&limit=5',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":3,"username":"marta"},{"id":11,"username":"laura"},{"id":5,"username":"john"},{"id":6,"username":"douglas"},{"id":10,"username":"cinderella"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '11'
        }
      }
    },
    {
      description:
        'Pagination bucket - sort id (default asc), get page 2, limit 5',
      path: '/pagination?sort=id&page=2&limit=5',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":6,"username":"douglas"},{"id":7,"username":"paul"},{"id":8,"username":"paula"},{"id":9,"username":"theresa"},{"id":10,"username":"cinderella"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '11'
        }
      }
    },
    {
      description: 'Pagination bucket - sort id desc, get page 2, limit 5',
      path: '/pagination?sort=id&order=desc&page=2&limit=5',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":6,"username":"douglas"},{"id":5,"username":"john"},{"id":4,"username":"mary"},{"id":3,"username":"marta"},{"id":2,"username":"alberto"}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '11'
        }
      }
    }
  ],
  [
    {
      description: 'Users bucket - get: rules return secondary response',
      path: '/users',
      method: 'GET',
      headers: { 'x-custom': 'enabled' },
      testedResponse: {
        status: 200,
        body: 'a'
      }
    }
  ],
  [
    {
      description: 'Misc bucket - check boolean true',
      path: '/testboolean',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: 'on'
      }
    },
    {
      description: 'Misc bucket - modify boolean false (POST)',
      path: '/misc',
      method: 'POST',
      body: 'false',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: 'false'
      }
    },
    {
      description: 'Misc bucket - check boolean false',
      path: '/testboolean',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: 'off'
      }
    },
    {
      description: 'Misc bucket - modify boolean true (PUT)',
      path: '/misc',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: 'true',
      testedResponse: {
        status: 200,
        body: 'true'
      }
    },
    {
      description: 'Misc bucket - check boolean true',
      path: '/testboolean',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: 'on'
      }
    },
    {
      description: 'Misc bucket - modify boolean false (PATCH)',
      path: '/misc',
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: 'false',
      testedResponse: {
        status: 200,
        body: 'false'
      }
    },
    {
      description: 'Misc bucket - check boolean false',
      path: '/testboolean',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: 'off'
      }
    },
    {
      description: 'Misc bucket - modify boolean empty (DELETE)',
      path: '/misc',
      method: 'DELETE',
      testedResponse: {
        status: 200,
        body: '{}'
      }
    },
    {
      description: 'Misc bucket - check boolean empty',
      path: '/testboolean',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: 'off'
      }
    },
    {
      description: 'Misc bucket - check boolean empty',
      path: '/misc',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: ''
      }
    }
  ],
  [
    {
      description: 'Misc bucket - modify number 51 (POST)',
      path: '/misc',
      method: 'POST',
      body: '51',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: '51'
      }
    },
    {
      description: 'Misc bucket - check number gt',
      path: '/testnumber',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: 'gt'
      }
    },
    {
      description: 'Misc bucket - modify number 49 (POST)',
      path: '/misc',
      method: 'POST',
      body: '49',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: '49'
      }
    },
    {
      description: 'Misc bucket - check number gt',
      path: '/testnumber',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: 'lt'
      }
    }
  ],
  [
    {
      description: 'Misc bucket - modify string teststring (POST)',
      path: '/misc',
      method: 'POST',
      body: 'teststring',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: 'teststring'
      }
    },
    {
      description: 'Misc bucket - check string yes',
      path: '/teststring',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: 'yes'
      }
    },
    {
      description: 'Misc bucket - modify string other (POST)',
      path: '/misc',
      method: 'POST',
      body: 'other',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: 'other'
      }
    },
    {
      description: 'Misc bucket - check string no',
      path: '/teststring',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: 'no'
      }
    }
  ],
  [
    {
      description: 'Misc bucket - modify object (POST)',
      path: '/misc',
      method: 'POST',
      body: '{"test":"hello"}',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: '{"test":"hello"}'
      }
    },
    {
      description: 'Misc bucket - check object after POST',
      path: '/misc',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '{"test":"hello"}'
      }
    },
    {
      description: 'Misc bucket - modify object (PUT)',
      path: '/misc',
      method: 'PUT',
      body: '{"test2":"hello2"}',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '{"test2":"hello2"}'
      }
    },
    {
      description: 'Misc bucket - check object after PUT',
      path: '/misc',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '{"test2":"hello2"}'
      }
    },
    {
      description: 'Misc bucket - modify object (PATCH)',
      path: '/misc',
      method: 'PATCH',
      body: '{"test3":"hello3"}',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '{"test2":"hello2","test3":"hello3"}'
      }
    },
    {
      description: 'Misc bucket - check object after PATCH',
      path: '/misc',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '{"test2":"hello2","test3":"hello3"}'
      }
    },
    {
      description: 'Misc bucket - delete object',
      path: '/misc',
      method: 'DELETE',
      testedResponse: {
        status: 200,
        body: '{}'
      }
    },
    {
      description: 'Misc bucket - check object after DELETE',
      path: '/misc',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: ''
      }
    }
  ],
  [
    {
      description: 'Array primitive bucket - get all',
      path: '/primitivearray',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '["aaa","bbb","ccc"]'
      }
    },
    {
      description: 'Array primitive bucket - get one',
      path: '/primitivearray/2',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: 'ccc'
      }
    },
    {
      description: 'Array primitive bucket - add item',
      path: '/primitivearray',
      method: 'POST',
      body: '"ddd"',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: 'ddd'
      }
    },
    {
      description: 'Array primitive bucket - get all',
      path: '/primitivearray',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '["aaa","bbb","ccc","ddd"]'
      }
    },
    {
      description: 'Array primitive bucket - update item',
      path: '/primitivearray/3',
      method: 'PUT',
      body: '"eee"',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: 'eee'
      }
    },
    {
      description: 'Array primitive bucket - get all',
      path: '/primitivearray',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '["aaa","bbb","ccc","eee"]'
      }
    },
    {
      description: 'Array primitive bucket - update full array',
      path: '/primitivearray',
      method: 'PUT',
      body: '[10,20,30]',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[10,20,30]'
      }
    },
    {
      description: 'Array primitive bucket - get all',
      path: '/primitivearray',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[10,20,30]'
      }
    },
    {
      description: 'Array primitive bucket - update item (merge)',
      path: '/primitivearray/2',
      method: 'PATCH',
      body: '40',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '40'
      }
    },
    {
      description: 'Array primitive bucket - get all',
      path: '/primitivearray',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[10,20,40]'
      }
    },
    {
      description: 'Array primitive bucket - update full array (merge)',
      path: '/primitivearray',
      method: 'PATCH',
      body: '[50]',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[10,20,40,50]'
      }
    },
    {
      description: 'Array primitive bucket - get all',
      path: '/primitivearray',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[10,20,40,50]'
      }
    },
    {
      description: 'Array primitive bucket - delete item',
      path: '/primitivearray/0',
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200
      }
    },
    {
      description: 'Array primitive bucket - get all',
      path: '/primitivearray',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '[20,40,50]'
      }
    },
    {
      description: 'Array primitive bucket - delete full array',
      path: '/primitivearray',
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200
      }
    },
    {
      description: 'Array primitive bucket - get all',
      path: '/primitivearray',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: ''
      }
    }
  ],
  [
    {
      description: 'Search - get all with search query "peter"',
      path: '/search?search=peter',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":1,"username":"peter","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description:
        'Search - get all with search query "paul" and order by "username" descending',
      path: '/search?search=paul&sort=username&order=desc',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":8,"username":"paula","age":40,"address":{"city":"San Francisco"},"hobbies":["swimming","coding"]},{"id":7,"username":"paul","age":25,"address":{"city":"Chicago"},"hobbies":["reading","dancing"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '2'
        }
      }
    }
  ],
  [
    {
      description:
        'Search - get all with search query "New York" in nested object',
      path: '/search?search=New%20York',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":1,"username":"peter","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]},{"id":5,"username":"john","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]},{"id":9,"username":"theresa","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '3'
        }
      }
    }
  ],
  [
    {
      description: 'Search - get all with search query "swimming" in array',
      path: '/search?search=swimming',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":1,"username":"peter","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]},{"id":4,"username":"mary","age":40,"address":{"city":"San Francisco"},"hobbies":["swimming","coding"]},{"id":5,"username":"john","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]},{"id":8,"username":"paula","age":40,"address":{"city":"San Francisco"},"hobbies":["swimming","coding"]},{"id":9,"username":"theresa","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '5'
        }
      }
    }
  ],
  [
    {
      description:
        'Search - get all with search query "dancing" in array and paginate',
      path: '/search?search=dancing&page=1&limit=2',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":2,"username":"alberto","age":35,"address":{"city":"Los Angeles"},"hobbies":["dancing","coding"]},{"id":3,"username":"marta","age":25,"address":{"city":"Chicago"},"hobbies":["reading","dancing"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '6'
        }
      }
    }
  ],
  [
    {
      description: 'Search - no match',
      path: '/search?search=nonexistent',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '0'
        }
      }
    }
  ],
  [
    {
      description: 'Search - partial match',
      path: '/search?search=pet',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":1,"username":"peter","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description: 'Search - matches multiple records for different reasons',
      path: '/search?search=ra',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":4,"username":"mary","age":40,"address":{"city":"San Francisco"},"hobbies":["swimming","coding"]},{"id":8,"username":"paula","age":40,"address":{"city":"San Francisco"},"hobbies":["swimming","coding"]},{"id":11,"username":"laura","age":25,"address":{"city":"Chicago"},"hobbies":["reading","dancing"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '3'
        }
      }
    }
  ],
  [
    {
      description: 'Search - matches multiple records with pagination',
      path: '/search?search=ra&page=1&limit=1',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":4,"username":"mary","age":40,"address":{"city":"San Francisco"},"hobbies":["swimming","coding"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '3'
        }
      }
    }
  ],
  [
    {
      description: 'Search - case insensitive',
      path: '/search?search=PETER',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":1,"username":"peter","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description: 'Search - empty string',
      path: '/search?search=&limit=1',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":1,"username":"peter","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '11'
        }
      }
    }
  ],
  [
    {
      description: 'Search - filter on numbers',
      path: '/search?search=8',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":8,"username":"paula","age":40,"address":{"city":"San Francisco"},"hobbies":["swimming","coding"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description: 'Search - filter on partial numbers',
      path: '/search?search=2',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":2,"username":"alberto","age":35,"address":{"city":"Los Angeles"},"hobbies":["dancing","coding"]},{"id":3,"username":"marta","age":25,"address":{"city":"Chicago"},"hobbies":["reading","dancing"]},{"id":7,"username":"paul","age":25,"address":{"city":"Chicago"},"hobbies":["reading","dancing"]},{"id":11,"username":"laura","age":25,"address":{"city":"Chicago"},"hobbies":["reading","dancing"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '4'
        }
      }
    }
  ],
  [
    {
      description: 'Search - filter on primitive array',
      path: '/primitivearray?search=a',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '["aaa"]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '3',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description: 'Filter - equal operator',
      path: '/search?username_eq=peter',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":1,"username":"peter","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '1'
        }
      }
    }
  ],
  [
    {
      description: 'Filter - not equal operator',
      path: '/search?age_ne=25&limit=2',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":1,"username":"peter","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]},{"id":2,"username":"alberto","age":35,"address":{"city":"Los Angeles"},"hobbies":["dancing","coding"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '8'
        }
      }
    }
  ],
  [
    {
      description: 'Filter - greater than operator',
      path: '/search?age_gt=35',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":4,"username":"mary","age":40,"address":{"city":"San Francisco"},"hobbies":["swimming","coding"]},{"id":8,"username":"paula","age":40,"address":{"city":"San Francisco"},"hobbies":["swimming","coding"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '2'
        }
      }
    }
  ],
  [
    {
      description: 'Filter - greater than or equal operator',
      path: '/search?age_gte=35',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":2,"username":"alberto","age":35,"address":{"city":"Los Angeles"},"hobbies":["dancing","coding"]},{"id":4,"username":"mary","age":40,"address":{"city":"San Francisco"},"hobbies":["swimming","coding"]},{"id":6,"username":"douglas","age":35,"address":{"city":"Los Angeles"},"hobbies":["dancing","coding"]},{"id":8,"username":"paula","age":40,"address":{"city":"San Francisco"},"hobbies":["swimming","coding"]},{"id":10,"username":"cinderella","age":35,"address":{"city":"Los Angeles"},"hobbies":["dancing","coding"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '5'
        }
      }
    }
  ],
  [
    {
      description: 'Filter - less than operator',
      path: '/search?age_lt=5',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '0'
        }
      }
    }
  ],
  [
    {
      description: 'Filter - less than or equal operator',
      path: '/search?age_lte=25',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":3,"username":"marta","age":25,"address":{"city":"Chicago"},"hobbies":["reading","dancing"]},{"id":7,"username":"paul","age":25,"address":{"city":"Chicago"},"hobbies":["reading","dancing"]},{"id":11,"username":"laura","age":25,"address":{"city":"Chicago"},"hobbies":["reading","dancing"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '3'
        }
      }
    }
  ],
  [
    {
      description: 'Filter - like operator',
      path: '/search?username_like=la',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":6,"username":"douglas","age":35,"address":{"city":"Los Angeles"},"hobbies":["dancing","coding"]},{"id":8,"username":"paula","age":40,"address":{"city":"San Francisco"},"hobbies":["swimming","coding"]},{"id":10,"username":"cinderella","age":35,"address":{"city":"Los Angeles"},"hobbies":["dancing","coding"]},{"id":11,"username":"laura","age":25,"address":{"city":"Chicago"},"hobbies":["reading","dancing"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '4'
        }
      }
    }
  ],
  [
    {
      description: 'Filter - start operator',
      path: '/search?username_start=p',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":1,"username":"peter","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]},{"id":7,"username":"paul","age":25,"address":{"city":"Chicago"},"hobbies":["reading","dancing"]},{"id":8,"username":"paula","age":40,"address":{"city":"San Francisco"},"hobbies":["swimming","coding"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '3'
        }
      }
    }
  ],
  [
    {
      description: 'Filter - start operator',
      path: '/search?username_end=la',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":8,"username":"paula","age":40,"address":{"city":"San Francisco"},"hobbies":["swimming","coding"]},{"id":10,"username":"cinderella","age":35,"address":{"city":"Los Angeles"},"hobbies":["dancing","coding"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '2'
        }
      }
    }
  ],
  [
    {
      description: 'Filter - like operator (regex)',
      path: '/search?id_like=^(1|4|7)$',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":1,"username":"peter","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]},{"id":4,"username":"mary","age":40,"address":{"city":"San Francisco"},"hobbies":["swimming","coding"]},{"id":7,"username":"paul","age":25,"address":{"city":"Chicago"},"hobbies":["reading","dancing"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '3'
        }
      }
    }
  ],
  [
    {
      description: 'Filter - nested properties access',
      path: '/search?address.city_eq=New%20York',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":1,"username":"peter","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]},{"id":5,"username":"john","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]},{"id":9,"username":"theresa","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '3'
        }
      }
    }
  ],
  [
    {
      description: 'Filter - filter on primitive array',
      path: '/primitivearray?_gte=b',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '["bbb","ccc"]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '3',
          'x-filtered-count': '2'
        }
      }
    }
  ],
  [
    {
      description: 'Filter + Search + Sort + Pagination',
      path: '/search?search=york&age_gt=25&sort=username&limit=1',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":5,"username":"john","age":30,"address":{"city":"New York"},"hobbies":["reading","swimming"]}]',
        headers: {
          'content-type': 'application/json',
          'x-total-count': '11',
          'x-filtered-count': '3'
        }
      }
    }
  ],
  [
    {
      description: 'Nested key bucket - get',
      path: '/nestedkey',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"sub":{"myid":"1"},"prop":"test1"},{"sub":{"myid":"2"},"prop":"test2"}]',
        headers: {
          'content-type': 'application/json'
        }
      }
    },
    {
      description: 'Nested key bucket - getById',
      path: '/nestedkey/1',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '{"sub":{"myid":"1"},"prop":"test1"}',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Nested key bucket - deleteById',
      path: '/nestedkey/1',
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200
      }
    },
    {
      description: 'Nested key bucket - get all after delete',
      path: '/nestedkey',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"sub":{"myid":"2"},"prop":"test2"}]',
        headers: {
          'content-type': 'application/json'
        }
      }
    },
    {
      description: 'Nested key bucket - updateMergeById',
      path: '/nestedkey/2',
      method: 'PATCH',
      body: '{"newprop":"test3"}',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200
      }
    },
    {
      description: 'Nested key bucket - get after update',
      path: '/nestedkey/2',
      method: 'PATCH',
      body: '{"sub":{"myid":"1"},"prop":"test1","newprop":"test3"}',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200
      }
    },
    {
      description: 'Nested key bucket - post',
      path: '/nestedkey',
      method: 'POST',
      body: '{"sub":{"myid":"5"},"prop":"test5"}',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201
      }
    },
    {
      description: 'Nested key bucket - get after post',
      path: '/nestedkey/5',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '{"sub":{"myid":"5"},"prop":"test5"}',
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Nested key bucket - post (missing key)',
      path: '/nestedkey',
      method: 'POST',
      // wrong key name
      body: '{"sub":{"id":"6"},"prop":"test6"}',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 201,
        body: new RegExp(
          /\{"sub"\:\{"id"\:"6"\,"myid"\:"[a-f0-9\-]{36}"\}\,"prop"\:"test6"\}/i
        ),
        headers: { 'content-type': 'application/json' }
      }
    }
  ]
];

describe('CRUD endpoints', () => {
  it('should open the environment', async () => {
    await environments.open('crud');
  });

  it('should create a new CRUD endpoint and verify UI', async () => {
    await routes.addCRUDRoute();
    await routes.setPath('users');
    await routes.assertMenuEntryText(4, '/users\nCRUD');
    await routes.assertSelectedRouteResponseLabel('CRUD operations');
  });

  it('should select a databucket and verify UI', async () => {
    await routes.assertDataBucketMenuLabel(
      'Select a databucket for CRUD operations'
    );
    await routes.openDataBucketMenu();
    await routes.selectDataBucket(1);
  });

  it('should add a second response with rule', async () => {
    await routes.addRouteResponse();
    await (await routes.bodyEditor).click();

    await browser.keys(['Backspace', 'Backspace', 'a']);

    await routes.switchTab('RULES');
    await routes.addResponseRule({
      target: 'header',
      modifier: 'x-custom',
      operator: 'equals',
      value: 'enabled',
      invert: false
    });
  });

  it('should add more endpoints', async () => {
    await routes.addCRUDRoute();
    await routes.setPath('users-numeric');
    await routes.openDataBucketMenu();
    await routes.selectDataBucket(2);

    await routes.addCRUDRoute();
    await routes.setPath('pagination');
    await routes.openDataBucketMenu();
    await routes.selectDataBucket(3);

    await routes.addCRUDRoute();
    await routes.setPath('misc');
    await routes.openDataBucketMenu();
    await routes.selectDataBucket(4);

    await routes.addCRUDRoute();
    await routes.setPath('primitivearray');
    await routes.openDataBucketMenu();
    await routes.selectDataBucket(5);

    await routes.addCRUDRoute();
    await routes.setPath('search');
    await routes.openDataBucketMenu();
    await routes.selectDataBucket(6);

    await routes.addCRUDRoute();
    await routes.setPath('nestedkey');
    await routes.openDataBucketMenu();
    await routes.selectDataBucket(7);
    await routes.setCrudKey('sub.myid');
  });

  it('should start the environment', async () => {
    await environments.start();
  });

  describe('Test calls: JSON bucket', () => {
    for (const jsonTestGroup of jsonArrayTestGroups) {
      it('should start the environment', async () => {
        await environments.stop();
        await environments.start();
      });

      for (const testCase of jsonTestGroup) {
        it(testCase.description, async () => {
          await http.assertCall(testCase);
        });
      }
    }
  });
});
