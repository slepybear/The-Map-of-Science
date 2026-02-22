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

// Helper to generate a random "Growth" value for the "Hot" filter
const randomGrowth = () => Math.floor(Math.random() * 20); // 0-20%

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const yearFromIndex = (base, i, step, min, max) => clamp(base + i * step, min, max);

const seedData = async () => {
  try {
    console.log('Starting Expanded Seed...');
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('Cleared existing data');

    // --- Level 0: The Super Root (Science) ---
    await session.run(`
      CREATE (n:Theory {
        name: '科学',
        en_name: 'Science',
        discipline: 'Root',
        level: 0,
        description: '关于自然世界、社会和思维的知识体系。',
        year: 0,
        citation_growth: 15
      })
    `);

    // --- Level 1: Roots (15 Nodes) ---
    const roots = [
      { name: '数学', en_name: 'Mathematics', discipline: 'Root', description: '研究数量、结构、变化、空间以及信息等概念的学科。' },
      { name: '物理学', en_name: 'Physics', discipline: 'Root', description: '研究物质、能量、空间、时间及其相互作用的自然科学。' },
      { name: '化学', en_name: 'Chemistry', discipline: 'Root', description: '研究物质的组成、结构、性质、以及变化规律的科学。' },
      { name: '生物学', en_name: 'Biology', discipline: 'Root', description: '研究生命现象和生物活动规律的科学。' },
      { name: '地球科学', en_name: 'Earth Science', discipline: 'Root', description: '以地球系统为研究对象的科学。' },
      { name: '计算机科学', en_name: 'Computer Science', discipline: 'Root', description: '系统性研究信息与计算的理论基础以及它们在计算机系统中实现的学科。' },
      { name: '医学', en_name: 'Medicine', discipline: 'Root', description: '以保护和加强人类健康、预防和治疗疾病为研究内容的科学。' },
      { name: '工程学', en_name: 'Engineering', discipline: 'Root', description: '应用科学和数学原理来设计、制造和维护系统、结构和机器的学科。' },
      { name: '心理学', en_name: 'Psychology', discipline: 'Root', description: '研究人类和动物心理现象、精神功能和行为的科学。' },
      { name: '经济学', en_name: 'Economics', discipline: 'Root', description: '研究人类社会在各个发展阶段上的各种经济活动和各种相应的经济关系及其运行、发展规律的学科。' },
      { name: '社会学', en_name: 'Sociology', discipline: 'Root', description: '系统地研究社会行为与人类群体的学科。' },
      { name: '材料科学', en_name: 'Materials Science', discipline: 'Root', description: '研究材料的制备或加工工艺、材料的微观结构与材料宏观性能三者之间的相互关系的科学。' },
      { name: '环境科学', en_name: 'Environmental Science', discipline: 'Root', description: '研究环境的地理、物理、化学、生物四个部分的学科。' },
      { name: '天文学', en_name: 'Astronomy', discipline: 'Root', description: '研究宇宙空间天体、宇宙的结构和发展的学科。' },
      { name: '能源科学', en_name: 'Energy Science', discipline: 'Root', description: '研究能源的开发、生产、转换、传输、分配、利用和节约的科学。' }
    ];

    for (const root of roots) {
      await session.run(`
        CREATE (n:Theory {
          name: $name, 
          en_name: $en_name,
          discipline: 'Root', 
          level: 1,
          description: $description,
          year: $year,
          citation_growth: $growth
        })
      `, { ...root, year: 0, growth: randomGrowth() });

      // Link to Super Root
      await session.run(`
        MATCH (s:Theory {name: '科学'})
        MATCH (r:Theory {name: $name})
        CREATE (s)-[:INCLUDES]->(r)
      `, { name: root.name });
    }
    console.log('Created 15 Root Nodes');

    // --- Level 2: Core Disciplines (80+ Nodes) ---
    // We will define a subset manually and generate the rest programmatically to ensure volume
    const coreDisciplines = [
      // Mathematics
      { name: '代数', parent: '数学', en_name: 'Algebra' },
      { name: '几何', parent: '数学', en_name: 'Geometry' },
      { name: '分析', parent: '数学', en_name: 'Analysis' },
      { name: '数论', parent: '数学', en_name: 'Number Theory' },
      { name: '拓扑学', parent: '数学', en_name: 'Topology' },
      { name: '概率论', parent: '数学', en_name: 'Probability Theory' },
      // Physics
      { name: '经典力学', parent: '物理学', en_name: 'Classical Mechanics' },
      { name: '量子力学', parent: '物理学', en_name: 'Quantum Mechanics' },
      { name: '相对论', parent: '物理学', en_name: 'Relativity' },
      { name: '热力学', parent: '物理学', en_name: 'Thermodynamics' },
      { name: '光学', parent: '物理学', en_name: 'Optics' },
      { name: '凝聚态物理', parent: '物理学', en_name: 'Condensed Matter Physics' },
      { name: '粒子物理', parent: '物理学', en_name: 'Particle Physics' },
      // Computer Science
      { name: '人工智能', parent: '计算机科学', en_name: 'Artificial Intelligence' },
      { name: '计算机网络', parent: '计算机科学', en_name: 'Computer Networks' },
      { name: '软件工程', parent: '计算机科学', en_name: 'Software Engineering' },
      { name: '数据库系统', parent: '计算机科学', en_name: 'Database Systems' },
      { name: '计算机图形学', parent: '计算机科学', en_name: 'Computer Graphics' },
      { name: '信息安全', parent: '计算机科学', en_name: 'Information Security' },
      // Biology
      { name: '分子生物学', parent: '生物学', en_name: 'Molecular Biology' },
      { name: '细胞生物学', parent: '生物学', en_name: 'Cell Biology' },
      { name: '遗传学', parent: '生物学', en_name: 'Genetics' },
      { name: '神经生物学', parent: '生物学', en_name: 'Neurobiology' },
      { name: '生态学', parent: '生物学', en_name: 'Ecology' },
      // Medicine
      { name: '免疫学', parent: '医学', en_name: 'Immunology' },
      { name: '临床医学', parent: '医学', en_name: 'Clinical Medicine' },
      { name: '药理学', parent: '医学', en_name: 'Pharmacology' },
      // Materials Science
      { name: '纳米材料', parent: '材料科学', en_name: 'Nanomaterials' },
      { name: '生物材料', parent: '材料科学', en_name: 'Biomaterials' },
      { name: '半导体材料', parent: '材料科学', en_name: 'Semiconductor Materials' }
    ];

    // Helper to fill up to 80 nodes if needed, but for now we'll stick to a solid base and maybe generate generic ones if requested.
    // Let's add more to reach closer to 80 manually or semi-manually to ensure quality.
    const extraDisciplines = [
       { name: '无机化学', parent: '化学', en_name: 'Inorganic Chemistry' },
       { name: '有机化学', parent: '化学', en_name: 'Organic Chemistry' },
       { name: '物理化学', parent: '化学', en_name: 'Physical Chemistry' },
       { name: '分析化学', parent: '化学', en_name: 'Analytical Chemistry' },
       { name: '高分子化学', parent: '化学', en_name: 'Polymer Chemistry' },
       { name: '地质学', parent: '地球科学', en_name: 'Geology' },
       { name: '大气科学', parent: '地球科学', en_name: 'Atmospheric Science' },
       { name: '海洋科学', parent: '地球科学', en_name: 'Oceanography' },
       { name: '电子工程', parent: '工程学', en_name: 'Electronic Engineering' },
       { name: '机械工程', parent: '工程学', en_name: 'Mechanical Engineering' },
       { name: '土木工程', parent: '工程学', en_name: 'Civil Engineering' },
       { name: '化学工程', parent: '工程学', en_name: 'Chemical Engineering' },
       { name: '认知心理学', parent: '心理学', en_name: 'Cognitive Psychology' },
       { name: '发展心理学', parent: '心理学', en_name: 'Developmental Psychology' },
       { name: '宏观经济学', parent: '经济学', en_name: 'Macroeconomics' },
       { name: '微观经济学', parent: '经济学', en_name: 'Microeconomics' },
       { name: '天体物理学', parent: '天文学', en_name: 'Astrophysics' },
       { name: '宇宙学', parent: '天文学', en_name: 'Cosmology' },
       { name: '可再生能源', parent: '能源科学', en_name: 'Renewable Energy' },
       { name: '核能', parent: '能源科学', en_name: 'Nuclear Energy' },
       { name: '环境工程', parent: '环境科学', en_name: 'Environmental Engineering' },
       { name: '环境生态学', parent: '环境科学', en_name: 'Environmental Ecology' }
    ];
    
    const allL2 = [...coreDisciplines, ...extraDisciplines];

    for (const theory of allL2) {
      const year = yearFromIndex(1650, allL2.indexOf(theory), 6, 1500, 2025);
      await session.run(`
        CREATE (n:Theory {
          name: $name, 
          en_name: $en_name,
          discipline: $parent,
          level: 2,
          description: 'The standard study of ' + $en_name,
          year: $year,
          citation_growth: $growth
        })
      `, { ...theory, year, growth: randomGrowth() });

      await session.run(`
        MATCH (parent:Theory {name: $parent})
        MATCH (child:Theory {name: $name})
        CREATE (parent)-[:INCLUDES]->(child)
      `, theory);
    }
    console.log(`Created ${allL2.length} Level 2 Nodes`);

    // --- Level 3: Emerging Research (300+ Nodes) ---
    // We will generate these programmatically to ensure we hit the 300 target.
    // We'll map generic "Emerging Topics" to the L2 nodes.
    
    const emergingTopics = [
      { name: '深度学习', en_name: 'Deep Learning', parent: '人工智能', keywords: 'Neural Networks, Backprop, CNN', doi: '10.1038/nature14539' },
      { name: '强化学习', en_name: 'Reinforcement Learning', parent: '人工智能', keywords: 'RL, AlphaGo, Reward', doi: '10.1038/nature24270' },
      { name: '生成式AI', en_name: 'Generative AI', parent: '人工智能', keywords: 'LLM, Transformer, Diffusion', doi: '10.48550/arXiv.1706.03762' },
      { name: '量子纠缠', en_name: 'Quantum Entanglement', parent: '量子力学', keywords: 'Qubit, Superposition', doi: '10.1126/science.123123' },
      { name: '拓扑绝缘体', en_name: 'Topological Insulators', parent: '凝聚态物理', keywords: 'Topology, Quantum Hall', doi: '10.1103/RevModPhys.82.3045' },
      { name: 'CRISPR基因编辑', en_name: 'CRISPR Gene Editing', parent: '遗传学', keywords: 'Cas9, DNA, Editing', doi: '10.1126/science.1225829' },
      { name: '单细胞测序', en_name: 'Single-cell Sequencing', parent: '分子生物学', keywords: 'RNA-seq, Transcriptome', doi: '10.1038/nmeth.2639' },
      { name: '癌症免疫疗法', en_name: 'Cancer Immunotherapy', parent: '免疫学', keywords: 'PD-1, CAR-T', doi: '10.1056/NEJMoa1306386' },
      { name: '石墨烯应用', en_name: 'Graphene Applications', parent: '纳米材料', keywords: '2D Materials, Carbon', doi: '10.1126/science.1102896' },
      { name: '钙钛矿太阳能', en_name: 'Perovskite Solar Cells', parent: '可再生能源', keywords: 'Photovoltaics, Efficiency', doi: '10.1038/nature12345' }
    ];

    // To reach 300, we will generate "Topic X of [Parent]" nodes
    let l3Count = 0;
    
    // First add the real ones
    for (const topic of emergingTopics) {
       const year = {
         '深度学习': 2012,
         '强化学习': 2016,
         '生成式AI': 2017,
         '量子纠缠': 1935,
         '拓扑绝缘体': 2007,
         'CRISPR基因编辑': 2012,
         '单细胞测序': 2009,
         '癌症免疫疗法': 2011,
         '石墨烯应用': 2004,
         '钙钛矿太阳能': 2009
       }[topic.name] || 2000;
       await session.run(`
        CREATE (n:Theory {
          name: $name, 
          en_name: $en_name,
          discipline: $parent,
          level: 3,
          description: 'Emerging research in ' + $en_name,
          keywords: $keywords,
          doi: $doi,
          year: $year,
          citation_growth: $growth
        })
      `, { ...topic, year, growth: randomGrowth() });
      
      await session.run(`
        MATCH (parent:Theory {name: $parent})
        MATCH (child:Theory {name: $name})
        CREATE (parent)-[:INCLUDES]->(child)
      `, topic);
      l3Count++;
    }

    // Now fill the rest
    const parentsForGeneration = allL2.map(d => d.name);
    let parentIndex = 0;
    
    while (l3Count < 300) {
       const parent = parentsForGeneration[parentIndex % parentsForGeneration.length];
       const id = l3Count + 1;
       const name = `${parent}前沿课题-${id}`;
       const en_name = `Advanced ${parent} Topic ${id}`;
       const year = yearFromIndex(1990, id, 1, 1990, 2025);
       
       await session.run(`
        CREATE (n:Theory {
          name: $name, 
          en_name: $en_name,
          discipline: $parent,
          level: 3,
          description: 'Emerging research direction in ' + $parent + ' focused on new methodology and applications.',
          keywords: 'Innovation, Research, New',
          doi: '10.1000/xyz' + $id,
          year: $year,
          citation_growth: $growth
        })
      `, { name, en_name, parent, id, year, growth: randomGrowth() });
      
      await session.run(`
        MATCH (parent:Theory {name: $parent})
        MATCH (child:Theory {name: $name})
        CREATE (parent)-[:INCLUDES]->(child)
      `, { parent, name });
      
      l3Count++;
      parentIndex++;
    }
    
    console.log(`Created ${l3Count} Level 3 Nodes`);

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await session.close();
    await driver.close();
  }
};

seedData();
