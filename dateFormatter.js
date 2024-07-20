// dateFormatter.js

/**
 * Formats a given Date object into a readable string format.
 * @param {Date} date - The date object to format.
 * @returns {string} - The formatted date string.
 */
function formatDate(date) {
  if (!(date instanceof Date)) {
    throw new Error("Invalid date object.");
  }

  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString('en-US', options);
}

// Example usage
const now = new Date();
console.log(`Formatted Date: ${formatDate(now)}`);
