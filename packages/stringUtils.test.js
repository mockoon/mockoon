
// stringUtils.test.js

const { capitalizeWords } = require('./stringUtils');

describe('capitalizeWords', () => {
  test('capitalizes the first letter of each word', () => {
    const input = "mockoon is awesome!";
    const expectedOutput = "Mockoon Is Awesome!";
    expect(capitalizeWords(input)).toBe(expectedOutput);
  });

  test('returns an empty string when input is an empty string', () => {
    const input = "";
    const expectedOutput = "";
    expect(capitalizeWords(input)).toBe(expectedOutput);
  });

  test('throws an error when input is not a string', () => {
    expect(() => capitalizeWords(123)).toThrow("Invalid input, expected a string.");
  });
});
