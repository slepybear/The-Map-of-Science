const neo4j = require('neo4j-driver');
require('dotenv').config({ path: '../.env' });

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || 'password')
);

const session = driver.session();

const randomGrowth = () => Math.floor(Math.random() * 30); // 0-30%
const randomYear = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const BATCH_SIZE = 500;

async function runBatch(query, paramsList) {
  if (paramsList.length === 0) return;
  const session = driver.session();
  try {
    await session.run(`
      UNWIND $props AS props
      CREATE (n:Theory)
      SET n = props
    `, { props: paramsList });
  } finally {
    await session.close();
  }
}

async function runRelBatch(query, paramsList) {
  if (paramsList.length === 0) return;
  const session = driver.session();
  try {
    await session.run(`
      UNWIND $props AS props
      MATCH (a:Theory {name: props.source})
      MATCH (b:Theory {name: props.target})
      CREATE (a)-[:INCLUDES]->(b)
    `, { props: paramsList });
  } finally {
    await session.close();
  }
}

const seedData = async () => {
  console.time('Seeding');
  try {
    console.log('Starting Large Scale Seed (5000+ nodes)...');
    
    const session = driver.session();
    await session.run('MATCH (n) DETACH DELETE n');
    await session.close();
    console.log('Cleared existing data');

    // --- Level 0: Root ---
    const root = {
      name: '科学',
      en_name: 'Science',
      discipline: 'Root',
      level: 0,
      description: 'The systematic study of the structure and behavior of the physical and natural world.',
      year: 0,
      citation_growth: 10,
      id: 'root_0'
    };

    await driver.session().run('CREATE (n:Theory $props)', { props: root });
    console.log('Created Root Node');

    // --- Level 1: Disciplines (15) ---
    const disciplines = [
      'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Earth Science', 
      'Computer Science', 'Medicine', 'Engineering', 'Psychology', 'Economics',
      'Sociology', 'Materials Science', 'Environmental Science', 'Astronomy', 'Energy Science'
    ];
    
    const l1Nodes = disciplines.map((d, i) => ({
      name: d, // Using English as name for simplicity in generation, can map to CN later if needed
      en_name: d,
      discipline: 'Root',
      level: 1,
      description: `The study of ${d}`,
      year: 1600 + i * 10,
      citation_growth: randomGrowth(),
      id: `l1_${i}`
    }));

    await runBatch('', l1Nodes);
    
    // Links L0 -> L1
    const l1Links = l1Nodes.map(n => ({ source: '科学', target: n.name }));
    await runRelBatch('', l1Links);
    console.log(`Created ${l1Nodes.length} Level 1 Nodes`);

    // --- Level 2: Sub-disciplines (~100) ---
    let l2Nodes = [];
    let l2Links = [];
    let l2Count = 0;

    l1Nodes.forEach((parent, i) => {
      const subCount = 7; // 15 * 7 = 105
      for (let j = 0; j < subCount; j++) {
        const name = `${parent.name} Field ${j+1}`;
        l2Nodes.push({
          name: name,
          en_name: name,
          discipline: parent.name,
          level: 2,
          description: `A sub-field of ${parent.name}`,
          year: randomYear(1700, 1900),
          citation_growth: randomGrowth(),
          id: `l2_${l2Count}`
        });
        l2Links.push({ source: parent.name, target: name });
        l2Count++;
      }
    });

    await runBatch('', l2Nodes);
    await runRelBatch('', l2Links);
    console.log(`Created ${l2Nodes.length} Level 2 Nodes`);

    // --- Level 3: Core Theories (~500) ---
    let l3Nodes = [];
    let l3Links = [];
    let l3Count = 0;

    l2Nodes.forEach((parent) => {
      const theoryCount = 5; // 105 * 5 = 525
      for (let k = 0; k < theoryCount; k++) {
        const name = `${parent.name} Theory ${k+1}`;
        l3Nodes.push({
          name: name,
          en_name: name,
          discipline: parent.discipline,
          level: 3,
          description: `Core theory in ${parent.name}`,
          year: randomYear(1850, 1950),
          citation_growth: randomGrowth(),
          id: `l3_${l3Count}`
        });
        l3Links.push({ source: parent.name, target: name });
        l3Count++;
      }
    });

    // Batch insert L3
    for (let i = 0; i < l3Nodes.length; i += BATCH_SIZE) {
      await runBatch('', l3Nodes.slice(i, i + BATCH_SIZE));
    }
    for (let i = 0; i < l3Links.length; i += BATCH_SIZE) {
      await runRelBatch('', l3Links.slice(i, i + BATCH_SIZE));
    }
    console.log(`Created ${l3Nodes.length} Level 3 Nodes`);

    // --- Level 4: Topics/Papers (~4500) ---
    // Target total 5000+. We have ~645 so far. Need ~4400 more.
    // 525 L3 nodes. 4400 / 525 ~= 8.4. Let's do 9 per L3.
    let l4Nodes = [];
    let l4Links = [];
    let l4Count = 0;

    l3Nodes.forEach((parent) => {
      const topicCount = 9; 
      for (let m = 0; m < topicCount; m++) {
        const name = `${parent.name} Topic ${m+1}`;
        l4Nodes.push({
          name: name,
          en_name: name,
          discipline: parent.discipline,
          level: 4,
          description: `Specific research topic in ${parent.name}`,
          year: randomYear(1950, 2024),
          citation_growth: randomGrowth(),
          id: `l4_${l4Count}`
        });
        l4Links.push({ source: parent.name, target: name });
        l4Count++;
      }
    });

    // Batch insert L4
    console.log(`Generating ${l4Nodes.length} Level 4 Nodes...`);
    for (let i = 0; i < l4Nodes.length; i += BATCH_SIZE) {
      await runBatch('', l4Nodes.slice(i, i + BATCH_SIZE));
      if ((i + BATCH_SIZE) % 1000 < BATCH_SIZE) console.log(`...inserted ${Math.min(i + BATCH_SIZE, l4Nodes.length)} nodes`);
    }
    for (let i = 0; i < l4Links.length; i += BATCH_SIZE) {
      await runRelBatch('', l4Links.slice(i, i + BATCH_SIZE));
    }
    console.log(`Created ${l4Nodes.length} Level 4 Nodes`);

    const total = 1 + l1Nodes.length + l2Nodes.length + l3Nodes.length + l4Nodes.length;
    console.log(`Total Nodes Created: ${total}`);

    // Create Indexes
    const sessionIdx = driver.session();
    await sessionIdx.run('CREATE INDEX theory_name_index IF NOT EXISTS FOR (n:Theory) ON (n.name)');
    await sessionIdx.run('CREATE INDEX theory_id_index IF NOT EXISTS FOR (n:Theory) ON (n.id)');
    await sessionIdx.close();
    console.log('Indexes created');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await driver.close();
    console.timeEnd('Seeding');
  }
};

seedData();
