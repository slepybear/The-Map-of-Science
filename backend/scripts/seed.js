const neo4j = require('neo4j-driver');
require('dotenv').config({ path: '../.env' });

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j', 
    process.env.NEO4J_PASSWORD || 'password' // Default local development password
  )
);

const session = driver.session();

const seedData = async () => {
  try {
    // Clear existing data
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('Cleared existing data');

    // Create Theories
    const theories = [
      { name: 'Classical Mechanics', discipline: 'Physics', year: 1687 },
      { name: 'Electromagnetism', discipline: 'Physics', year: 1865 },
      { name: 'Thermodynamics', discipline: 'Physics', year: 1824 },
      { name: 'Quantum Mechanics', discipline: 'Physics', year: 1900 },
      { name: 'Special Relativity', discipline: 'Physics', year: 1905 },
      { name: 'General Relativity', discipline: 'Physics', year: 1915 },
      { name: 'Standard Model', discipline: 'Physics', year: 1970 },
      { name: 'String Theory', discipline: 'Physics', year: 1968 },
      { name: 'Evolution', discipline: 'Biology', year: 1859 },
      { name: 'Genetics', discipline: 'Biology', year: 1866 },
      { name: 'DNA Structure', discipline: 'Biology', year: 1953 },
      { name: 'Periodic Table', discipline: 'Chemistry', year: 1869 },
      { name: 'Organic Chemistry', discipline: 'Chemistry', year: 1828 },
      { name: 'Calculus', discipline: 'Mathematics', year: 1665 },
      { name: 'Set Theory', discipline: 'Mathematics', year: 1874 },
      { name: 'Turing Machine', discipline: 'Computer Science', year: 1936 },
      { name: 'Information Theory', discipline: 'Computer Science', year: 1948 }
    ];

    for (const theory of theories) {
      await session.run(
        'CREATE (t:Theory {name: $name, discipline: $discipline, year: $year})',
        theory
      );
    }
    console.log('Created theories');

    // Create Relationships
    const relationships = [
      { source: 'Classical Mechanics', target: 'Special Relativity', type: 'DEVELOPED_FROM' },
      { source: 'Electromagnetism', target: 'Special Relativity', type: 'DEVELOPED_FROM' },
      { source: 'Special Relativity', target: 'General Relativity', type: 'DEVELOPED_FROM' },
      { source: 'Quantum Mechanics', target: 'Standard Model', type: 'DERIVED_FROM' },
      { source: 'Classical Mechanics', target: 'Thermodynamics', type: 'RELATED_TO' },
      { source: 'Genetics', target: 'DNA Structure', type: 'DERIVED_FROM' },
      { source: 'Evolution', target: 'Genetics', type: 'DEPENDS_ON' },
      { source: 'Calculus', target: 'Classical Mechanics', type: 'FOUNDATION_OF' },
      { source: 'Turing Machine', target: 'Information Theory', type: 'RELATED_TO' }
    ];

    for (const rel of relationships) {
      // Using string interpolation for relationship type (be careful with user input in real apps)
      const query = `
        MATCH (a:Theory {name: $source})
        MATCH (b:Theory {name: $target})
        CREATE (a)-[:${rel.type}]->(b)
      `;
      await session.run(query, rel);
    }
    console.log('Created relationships');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await session.close();
    await driver.close();
  }
};

seedData();
