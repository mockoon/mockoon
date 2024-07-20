// randomNumberGenerator.js

/**
 * Generates a random number between the provided min and max values.
 * @param {number} min - The minimum value (inclusive).
 * @param {number} max - The maximum value (inclusive).
 * @returns {number} - A random number between min and max.
 */
function generateRandomNumber(min, max) {
  if (min > max) {
    throw new Error("Min value should be less than or equal to max value.");
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Example usage
const randomNumber = generateRandomNumber(1, 100);
console.log(`Random Number: ${randomNumber}`);
