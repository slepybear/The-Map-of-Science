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
    // 1. 清空现有数据
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('Cleared existing data');

    // 2. 创建一级学科（基石学科）
    const root = { name: '科学', discipline: 'Root', description: '关于自然世界、社会和思维的知识体系。' };
    await session.run('CREATE (n:Theory {name: $name, discipline: $discipline, description: $description})', root);

    const disciplines = [
      { name: '数学', discipline: 'Mathematics', description: '研究数量、结构、变化、空间以及信息等概念的学科。' },
      { name: '物理学', discipline: 'Physics', description: '研究物质、能量、空间、时间及其相互作用的自然科学。' },
      { name: '化学', discipline: 'Chemistry', description: '研究物质的组成、结构、性质、以及变化规律的科学。' },
      { name: '生物学', discipline: 'Biology', description: '研究生命现象和生物活动规律的科学。' },
      { name: '地球科学', discipline: 'EarthScience', description: '以地球系统为研究对象的科学。' }
    ];

    for (const disc of disciplines) {
      await session.run('CREATE (n:Theory {name: $name, discipline: $discipline, description: $description})', disc);
      await session.run(`
        MATCH (root:Theory {name: '科学'})
        MATCH (disc:Theory {name: $name})
        CREATE (root)-[:INCLUDES]->(disc)
      `, { name: disc.name });
    }
    console.log('Created disciplines');

    // 3. 创建二级核心理论（基于高中基础）
    const coreTheories = [
      // 数学
      { name: '代数', parent: '数学', description: '研究数、数量、关系、结构与代数方程（组）的通用解法及其性质的数学分支。' },
      { name: '几何', parent: '数学', description: '研究空间结构及性质的数学分支。' },
      { name: '微积分初步', parent: '数学', description: '研究函数的微分、积分以及有关概念和应用的数学分支。' },
      { name: '概率与统计', parent: '数学', description: '研究随机现象数量规律的数学分支。' },
      
      // 物理学
      { name: '经典力学', parent: '物理学', description: '研究宏观物体低速运动规律的学科。' },
      { name: '电磁学', parent: '物理学', description: '研究电磁现象及其规律的学科。' },
      { name: '热力学', parent: '物理学', description: '研究热现象中物质系统在平衡时的性质和建立能量的平衡关系的学科。' },
      { name: '光学', parent: '物理学', description: '研究光的传播、性质及其与物质相互作用的学科。' },
      { name: '原子物理', parent: '物理学', description: '研究原子的结构、运动规律及原子核反应的学科。' },

      // 化学
      { name: '无机化学', parent: '化学', description: '研究无机化合物的化学分支。' },
      { name: '有机化学', parent: '化学', description: '研究有机化合物的结构、性质、制备的学科。' },
      { name: '物理化学', parent: '化学', description: '从物理学角度分析化学系统的原理和规律。' },

      // 生物学
      { name: '细胞生物学', parent: '生物学', description: '研究细胞结构、功能及生命活动规律的学科。' },
      { name: '遗传学', parent: '生物学', description: '研究生物遗传和变异规律的科学。' },
      { name: '生态学', parent: '生物学', description: '研究生物与环境之间相互关系的科学。' },

      // 地球科学
      { name: '自然地理', parent: '地球科学', description: '研究地球表层的自然地理环境。' },
      { name: '地质学', parent: '地球科学', description: '研究地球的物质组成、内部构造、外部特征、各层圈之间的相互作用和演变历史。' }
    ];

    for (const theory of coreTheories) {
      await session.run('CREATE (n:Theory {name: $name, discipline: $parent, description: $description})', theory);
      await session.run(`
        MATCH (parent:Theory {name: $parent})
        MATCH (child:Theory {name: $name})
        CREATE (parent)-[:INCLUDES]->(child)
      `, theory);
    }
    console.log('Created core theories');

    // 4. 创建三级具体知识点（基于高中基础）
    const subTheories = [
      // 数学 - 代数
      { name: '函数', parent: '代数', description: '描述两个集合之间对应关系的数学概念。' },
      { name: '不等式', parent: '代数', description: '表示两个量之间不相等关系的式子。' },
      { name: '数列', parent: '代数', description: '按一定次序排列的一列数。' },
      
      // 数学 - 几何
      { name: '平面几何', parent: '几何', description: '研究平面上图形性质的学科。' },
      { name: '立体几何', parent: '几何', description: '研究三维空间中图形性质的学科。' },
      { name: '解析几何', parent: '几何', description: '用代数方法研究几何问题的学科。' },

      // 物理 - 经典力学
      { name: '牛顿运动定律', parent: '经典力学', description: '描述物体运动与受力关系的三个基本定律。' },
      { name: '万有引力定律', parent: '经典力学', description: '描述物体间引力相互作用的定律。' },
      { name: '能量守恒定律', parent: '经典力学', description: '能量既不会凭空产生，也不会凭空消失，只能从一种形式转化为另一种形式。' },

      // 物理 - 电磁学
      { name: '库仑定律', parent: '电磁学', description: '描述静止点电荷之间相互作用力的定律。' },
      { name: '欧姆定律', parent: '电磁学', description: '描述电流、电压、电阻之间关系的定律。' },
      { name: '电磁感应', parent: '电磁学', description: '磁通量变化产生感应电动势的现象。' },

      // 化学 - 无机化学
      { name: '元素周期表', parent: '无机化学', description: '根据原子序数从小至大排序的化学元素列表。' },
      { name: '化学键', parent: '无机化学', description: '分子或晶体中原子之间的强相互作用。' },
      { name: '氧化还原反应', parent: '无机化学', description: '涉及电子转移的化学反应。' },

      // 化学 - 有机化学
      { name: '烃', parent: '有机化学', description: '仅由碳和氢两种元素组成的有机化合物。' },
      { name: '烃的衍生物', parent: '有机化学', description: '烃分子中的氢原子被其他原子或原子团取代后的产物。' },

      // 生物 - 细胞生物学
      { name: '细胞结构', parent: '细胞生物学', description: '细胞膜、细胞质、细胞核等组成部分。' },
      { name: '细胞代谢', parent: '细胞生物学', description: '细胞内发生的化学反应，包括物质代谢和能量代谢。' },
      { name: '细胞分裂', parent: '细胞生物学', description: '细胞增殖的过程，包括有丝分裂和减数分裂。' },

      // 生物 - 遗传学
      { name: '孟德尔遗传定律', parent: '遗传学', description: '分离定律和自由组合定律。' },
      { name: 'DNA结构与功能', parent: '遗传学', description: '脱氧核糖核酸的双螺旋结构及其遗传信息传递功能。' },
      { name: '基因工程', parent: '遗传学', description: '人为操作基因的技术。' }
    ];

    for (const sub of subTheories) {
      await session.run('CREATE (n:Theory {name: $name, description: $description})', sub);
      await session.run(`
        MATCH (parent:Theory {name: $parent})
        MATCH (child:Theory {name: $name})
        CREATE (parent)-[:INCLUDES]->(child)
      `, sub);
    }
    console.log('Created sub theories');

    // 5. 创建横向关联关系（基于高中基础）
    const relationships = [
      { source: '微积分初步', target: '经典力学', type: 'APPLIED_TO', description: '微积分是研究变速运动和变力做功的工具' },
      { source: '解析几何', target: '函数', type: 'RELATED_TO', description: '解析几何利用函数研究曲线' },
      { source: '能量守恒定律', target: '热力学', type: 'FOUNDATION_OF', description: '能量守恒是热力学第一定律的基础' },
      { source: '原子物理', target: '元素周期表', type: 'EXPLAINS', description: '原子结构解释了元素周期律' },
      { source: '化学键', target: '有机化学', type: 'FOUNDATION_OF', description: '化学键理论解释了有机分子的结构' },
      { source: 'DNA结构与功能', target: '化学键', type: 'DEPENDS_ON', description: 'DNA双螺旋结构依赖氢键维持' },
      { source: '细胞分裂', target: '遗传学', type: 'BASIS_OF', description: '细胞分裂是遗传的基础' }
    ];

    for (const rel of relationships) {
      await session.run(`
        MATCH (a:Theory {name: $source})
        MATCH (b:Theory {name: $target})
        CREATE (a)-[:${rel.type} {description: $description}]->(b)
      `, rel);
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
