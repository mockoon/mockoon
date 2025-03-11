export const demoTemplates = [
  {
    prompt: 'get all holiday destinations',
    body: '[\n  {{#repeat 5}}\n    {\n      "name": "{{faker \'location.city\'}}",\n      "country": "{{faker \'location.country\'}}",\n      "description": "{{faker \'lorem.paragraph\'}}",\n      "rating": {{faker \'number.int\' min=1 max=5}}},\n      "isPopular": {{faker \'datatype.boolean\'}}\n    }\n  {{/repeat}}\n]',
    method: 'get',
    endpoint: 'destinations',
    documentation: 'Get all holiday destinations'
  },
  {
    prompt: 'delete a blog post',
    body: '{\n  "message": "Blog post with ID {{faker.random.number}} has been deleted successfully."\n}',
    method: 'delete',
    endpoint: 'blog-posts',
    documentation: 'Delete a blog post by ID'
  },
  {
    prompt: 'add a new movie',
    body: '{\n  "id": "{{faker \'string.uuid\'}}",\n  "title": "{{faker \'lorem.words\'}}",\n  "genre": "{{faker \'lorem.word\'}}",\n  "release_date": "{{faker \'date.past\'}}",\n  "director": "{{faker \'person.fullName\'}}",\n  "actors": [\n    {\n      "name": "{{faker \'person.fullName\'}}",\n      "role": "{{faker \'person.jobTitle\'}}"\n    }\n  ]\n}',
    method: 'post',
    endpoint: 'movies',
    documentation: 'Endpoint to add a new movie'
  },
  {
    prompt: 'update an invoice',
    body: '{\n  "id": "{{faker \'string.uuid\'}}",\n  "invoice_number": "{{faker \'number.int\' max=99999}}",\n  "customer_name": "{{faker \'person.firstName\'}} {{faker \'name.lastName\'}}",\n  "amount": "{{faker \'finance.amount\'}}",\n  "due_date": "{{faker \'date.future\'}}",\n  "status": "{{faker \'helpers.arrayElement\' (array \'paid\' \'pending\' \'overdue\')}}"\n}',
    method: 'patch',
    endpoint: 'invoices/:id',
    documentation: 'Update an invoice by ID'
  },
  {
    prompt: 'get top 10 IMDb movies',
    body: "[\n  {\n    \"id\": \"{{faker 'string.uuid'}}\",\n    \"title\": \"{{faker 'lorem.words'}}\",\n    \"year\": \"{{faker 'date.past'}}\",\n    \"rating\": {{faker 'number.int'({'min':1,'max':10})}},\n    \"genre\": \"{{faker 'helpers.arrayElement' (array 'Action' 'Comedy' 'Drama' 'Horror' 'Sci-Fi')}}\"\n  },\n  {\n    \"id\": \"{{faker 'string.uuid'}}\",\n    \"title\": \"{{faker 'lorem.words'}}\",\n    \"year\": \"{{faker 'date.past'}}\",\n    \"rating\": {{faker 'number.int'({'min':1,'max':10})}},\n    \"genre\": \"{{faker 'helpers.arrayElement' (array 'Action' 'Comedy' 'Drama' 'Horror' 'Sci-Fi')}}\"\n  },\n  {\n    \"id\": \"{{faker 'string.uuid'}}\",\n    \"title\": \"{{faker 'lorem.words'}}\",\n    \"year\": \"{{faker 'date.past'}}\",\n    \"rating\": {{faker 'number.int'({'min':1,'max':10})}},\n    \"genre\": \"{{faker 'helpers.arrayElement' (array 'Action' 'Comedy' 'Drama' 'Horror' 'Sci-Fi')}}\"\n  },\n  {\n    \"id\": \"{{faker 'string.uuid'}}\",\n    \"title\": \"{{faker 'lorem.words'}}\",\n    \"year\": \"{{faker 'date.past'}}\",\n    \"rating\": {{faker 'number.int'({'min':1,'max':10})}},\n    \"genre\": \"{{faker 'helpers.arrayElement' (array 'Action' 'Comedy' 'Drama' 'Horror' 'Sci-Fi')}}\"\n  },\n  {\n    \"id\": \"{{faker 'string.uuid'}}\",\n    \"title\": \"{{faker 'lorem.words'}}\",\n    \"year\": \"{{faker 'date.past'}}\",\n    \"rating\": {{faker 'number.int'({'min':1,'max':10})}},\n    \"genre\": \"{{faker 'helpers.arrayElement' (array 'Action' 'Comedy' 'Drama' 'Horror' 'Sci-Fi')}}\"\n  },\n  {\n    \"id\": \"{{faker 'string.uuid'}}\",\n    \"title\": \"{{faker 'lorem.words'}}\",\n    \"year\": \"{{faker 'date.past'}}\",\n    \"rating\": {{faker 'number.int'({'min':1,'max':10})}},\n    \"genre\": \"{{faker 'helpers.arrayElement' (array 'Action' 'Comedy' 'Drama' 'Horror' 'Sci-Fi')}}\"\n  },\n  {\n    \"id\": \"{{faker 'string.uuid'}}\",\n    \"title\": \"{{faker 'lorem.words'}}\",\n    \"year\": \"{{faker 'date.past'}}\",\n    \"rating\": {{faker 'number.int'({'min':1,'max':10})}},\n    \"genre\": \"{{faker 'helpers.arrayElement' (array 'Action' 'Comedy' 'Drama' 'Horror' 'Sci-Fi')}}\"\n  },\n  {\n    \"id\": \"{{faker 'string.uuid'}}\",\n    \"title\": \"{{faker 'lorem.words'}}\",\n    \"year\": \"{{faker 'date.past'}}\",\n    \"rating\": {{faker 'number.int'({'min':1,'max':10})}},\n    \"genre\": \"{{faker 'helpers.arrayElement' (array 'Action' 'Comedy' 'Drama' 'Horror' 'Sci-Fi')}}\"\n  },\n  {\n    \"id\": \"{{faker 'string.uuid'}}\",\n    \"title\": \"{{faker 'lorem.words'}}\",\n    \"year\": \"{{faker 'date.past'}}\",\n    \"rating\": {{faker 'number.int'({'min':1,'max':10})}},\n    \"genre\": \"{{faker 'helpers.arrayElement' (array 'Action' 'Comedy' 'Drama' 'Horror' 'Sci-Fi')}}\"\n  }\n]",
    method: 'get',
    endpoint: 'movies/top',
    documentation: 'Get top 10 IMDb movies'
  },
  {
    prompt: 'full update of a user',
    body: '{\n  "id": "{{faker \'string.uuid\'}}",\n  "name": "{{faker \'person.fullName\'}}",\n  "email": "{{faker \'internet.email\'}}",\n  "age": {{faker \'number.int\'({"min":18,"max":60})}},\n  "address": {\n    "street": "{{faker \'address.streetAddress\'}}",\n    "city": "{{faker \'location.city\'}}",\n    "zipcode": "{{faker \'address.zipCode\'}}"\n  }\n}',
    method: 'put',
    endpoint: 'users/:id'
  }
];
