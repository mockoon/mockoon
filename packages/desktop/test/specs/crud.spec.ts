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
        body: '[{"id":1,"name":"john"}]',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - getById',
      path: '/users/1',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '{"id":1,"name":"john"}',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - getById: wrong id',
      path: '/users/123',
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
        body: /\[\{"id":1,"name":"john"\},\{"id":"[a-z0-9-]{36}"\}\]/,
        headers: { 'content-type': 'application/json' }
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
        body: /\[\{"id":1,"name":"john"\},\{"id":"[a-z0-9-]{36}"\}\]/,
        headers: { 'content-type': 'application/json' }
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
        body: /\{"id":"[a-z0-9-]{36}","test":"hello"\}/,
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
        body: /\[\{"id":1,"name":"john"\},\{"id":"[a-z0-9-]{36}","test":"hello"\}\]/,
        headers: { 'content-type': 'application/json' }
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
        body: '[{"id":1,"name":"john"},{"id":"idtest","test":"hello"}]',
        headers: { 'content-type': 'application/json' }
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
        body: '[{"id":1,"name":"john"},"teststring"]',
        headers: { 'content-type': 'application/json' }
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
        body: '[{"id":1,"name":"john"},"test,string"]',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update: incorrect id',
      path: '/users/123',
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
      path: '/users/1',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      testedResponse: {
        status: 200,
        body: '{"id":1}',
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
        body: '[{"id":1}]',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update: empty object',
      path: '/users/1',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: {},
      testedResponse: {
        status: 200,
        body: '{"id":1}',
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
        body: '[{"id":1}]',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update: object, new prop, no id',
      path: '/users/1',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: { test: 'hello' },
      testedResponse: {
        status: 200,
        body: '{"id":1,"test":"hello"}',
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
        body: '[{"id":1,"test":"hello"}]',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update: object, new prop, id',
      path: '/users/1',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: { id: '123', test: 'hello' },
      testedResponse: {
        status: 200,
        body: '{"id":"123","test":"hello"}',
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
        body: '[{"id":"123","test":"hello"}]',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update: object, string',
      path: '/users/1',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: 'teststring',
      testedResponse: {
        status: 200,
        body: '{"id":1}',
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
        body: '[{"id":1}]',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update: object, broken json',
      path: '/users/1',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: 'test,string',
      testedResponse: {
        status: 200,
        body: '{"id":1}',
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
        body: '[{"id":1}]',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - full update',
      path: '/users',
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: [{ id: '123', test: 'hello' }],
      testedResponse: {
        status: 200,
        body: '[{"id":"123","test":"hello"}]',
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
        body: '[{"id":"123","test":"hello"}]',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update (merge): incorrect id',
      path: '/users/123',
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
      path: '/users/1',
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: {},
      testedResponse: {
        status: 200,
        body: '{"id":1,"name":"john"}',
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
        body: '[{"id":1,"name":"john"}]',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update (merge): object body',
      path: '/users/1',
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: { test: 'hello' },
      testedResponse: {
        status: 200,
        body: '{"id":1,"name":"john","test":"hello"}',
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
        body: '[{"id":1,"name":"john","test":"hello"}]',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update (merge): string',
      path: '/users/1',
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: 'teststring',
      testedResponse: {
        status: 200,
        body: '{"id":1,"name":"john"}',
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
        body: '[{"id":1,"name":"john"}]',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - update (merge): broken json',
      path: '/users/1',
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: 'test,string',
      testedResponse: {
        status: 200,
        body: '{"id":1,"name":"john"}',
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
        body: '[{"id":1,"name":"john"}]',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - full update (merge)',
      path: '/users',
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: [{ id: 2, test: 'hello' }],
      testedResponse: {
        status: 200,
        body: '[{"id":1,"name":"john"},{"id":2,"test":"hello"}]',
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
        body: '[{"id":1,"name":"john"},{"id":2,"test":"hello"}]',
        headers: { 'content-type': 'application/json' }
      }
    }
  ],
  [
    {
      description: 'Users bucket - delete: incorrect id',
      path: '/users/123',
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
      path: '/users/1',
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
        headers: { 'content-type': 'application/json' }
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
        headers: { 'content-type': 'application/json' }
      }
    },
    {
      description: 'Pagination bucket - get limit 5',
      path: '/pagination?limit=5',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":1,"username":"peter"},{"id":2,"username":"alberto"},{"id":3,"username":"marta"},{"id":4,"username":"mary"},{"id":5,"username":"john"}]',
        headers: { 'content-type': 'application/json', 'x-total-count': '11' }
      }
    },
    {
      description: 'Pagination bucket - get page 1 (default limit 10)',
      path: '/pagination?page=1',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":1,"username":"peter"},{"id":2,"username":"alberto"},{"id":3,"username":"marta"},{"id":4,"username":"mary"},{"id":5,"username":"john"},{"id":6,"username":"douglas"},{"id":7,"username":"paul"},{"id":8,"username":"paula"},{"id":9,"username":"theresa"},{"id":10,"username":"cinderella"}]',
        headers: { 'content-type': 'application/json', 'x-total-count': '11' }
      }
    },
    {
      description: 'Pagination bucket - get page 2, limit 5',
      path: '/pagination?page=2&limit=5',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":6,"username":"douglas"},{"id":7,"username":"paul"},{"id":8,"username":"paula"},{"id":9,"username":"theresa"},{"id":10,"username":"cinderella"}]',
        headers: { 'content-type': 'application/json', 'x-total-count': '11' }
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
        headers: { 'content-type': 'application/json', 'x-total-count': '11' }
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
        headers: { 'content-type': 'application/json', 'x-total-count': '11' }
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
        headers: { 'content-type': 'application/json', 'x-total-count': '11' }
      }
    },
    {
      description: 'Pagination bucket - sort id desc, get page 2, limit 5',
      path: '/pagination?sort=id&order=desc&page=2&limit=5',
      method: 'GET',
      testedResponse: {
        status: 200,
        body: '[{"id":6,"username":"douglas"},{"id":5,"username":"john"},{"id":4,"username":"mary"},{"id":3,"username":"marta"},{"id":2,"username":"alberto"}]',
        headers: { 'content-type': 'application/json', 'x-total-count': '11' }
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
    await routes.setPath('pagination');
    await routes.openDataBucketMenu();
    await routes.selectDataBucket(2);

    await routes.addCRUDRoute();
    await routes.setPath('misc');
    await routes.openDataBucketMenu();
    await routes.selectDataBucket(3);

    await routes.addCRUDRoute();
    await routes.setPath('primitivearray');
    await routes.openDataBucketMenu();
    await routes.selectDataBucket(4);
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
