const { toNativeTypes } = require('./utils');
const neo4j = require('neo4j-driver');

describe('utils', () => {
  test('toNativeTypes should convert neo4j integers to numbers', () => {
    const int = neo4j.int(42);
    expect(toNativeTypes(int)).toBe(42);
  });

  test('toNativeTypes should handle nested objects', () => {
    const obj = {
      id: neo4j.int(1),
      props: {
        count: neo4j.int(100)
      }
    };
    const expected = {
      id: 1,
      props: {
        count: 100
      }
    };
    expect(toNativeTypes(obj)).toEqual(expected);
  });

  test('toNativeTypes should handle arrays', () => {
    const arr = [neo4j.int(1), neo4j.int(2)];
    expect(toNativeTypes(arr)).toEqual([1, 2]);
  });
});
