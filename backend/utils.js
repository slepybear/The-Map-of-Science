const neo4j = require('neo4j-driver');

/**
 * Recursively converts Neo4j Integers to native JavaScript numbers.
 * Also handles nested objects and arrays.
 * 
 * @param {any} obj - The object to process
 * @returns {any} - The processed object with native numbers
 */
const toNativeTypes = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (neo4j.isInt(obj)) {
    return obj.toNumber();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toNativeTypes(item));
  }

  if (typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = toNativeTypes(obj[key]);
      }
    }
    return newObj;
  }

  return obj;
};

module.exports = {
  toNativeTypes
};
