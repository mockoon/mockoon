import faker from '@faker-js/faker';
import { GraphQLField, GraphQLSchema } from 'graphql';

const mockTypesKey = '__mockTypes';

const typeMocks = {
  ID: () => faker.datatype.uuid(),
  String: () => faker.datatype.string(10),
  Int: () => faker.datatype.number({ min: -50000, max: +50000 }),
  Float: () =>
    faker.datatype.float({ precision: 0.01, min: -50000, max: +50000 }),
  Boolean: () => faker.datatype.boolean()
};

const mockDefaultTypes = (fieldType: any) => typeMocks[fieldType]();

const mockFromType = (fieldType: string, mockData: any) =>
  mockData[mockTypesKey]?.[fieldType] !== undefined
    ? mockData[mockTypesKey][fieldType]
    : mockDefaultTypes(fieldType);

const mockFromData =
  (mockData: any, field: GraphQLField<any, any>) => (args: any) => {
    const fieldMockData = mockData[field.name];

    if (
      field.args.length &&
      args[field.args[0].name] &&
      Array.isArray(fieldMockData)
    ) {
      return fieldMockData.filter(
        (fieldDataItem) =>
          fieldDataItem[field.args[0].name] === args[field.args[0].name]
      );
    }

    return fieldMockData;
  };

export const buildRootResolvers = (schema: GraphQLSchema, mockData: any) => {
  const schemaFields = schema.getQueryType()?.getFields();

  if (schemaFields) {
    return Object.keys(schemaFields).reduce((rootFields, fieldName) => {
      rootFields[schemaFields[fieldName].name] =
        mockData[schemaFields[fieldName].name] === undefined
          ? mockFromType(schemaFields[fieldName].type.toString(), mockData)
          : mockFromData(mockData, schemaFields[fieldName]);

      return rootFields;
    }, {});
  }

  return null;
};
