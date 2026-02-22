const express = require('express');
const neo4j = require('neo4j-driver');
const redis = require('redis');
const cors = require('cors');
require('dotenv').config();
const { toNativeTypes } = require('./utils');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Neo4j connection
const neo4jDriver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j', 
    process.env.NEO4J_PASSWORD || 'password' // Default local development password
  )
);

// Redis connection
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
  await redisClient.connect();
})();

const getSession = () => neo4jDriver.session({ defaultAccessMode: neo4j.session.READ });

const normalizeTheoryNode = (node) => {
  const props = toNativeTypes(node.properties);
  const id = props.id || props.name;
  return {
    id,
    name: props.name,
    en_name: props.en_name,
    discipline: props.discipline,
    description: props.description,
    level: props.level,
    year: props.year,
    keywords: props.keywords,
    doi: props.doi,
    citation_growth: props.citation_growth
  };
};

const normalizeRelationship = (rel, sourceName, targetName) => {
  const props = toNativeTypes(rel.properties || {});
  return {
    id: props.id || `${sourceName}::${rel.type}::${targetName}`,
    source: sourceName,
    target: targetName,
    type: rel.type,
    description: props.description
  };
};

const cacheGetJson = async (key) => {
  const v = await redisClient.get(key);
  if (!v) return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

const cacheSetJson = async (key, value, ttlSeconds) => {
  await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
};

const parseIntSafe = (value, fallback) => {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
};

const clampInt = (value, min, max, fallback) => {
  const n = parseIntSafe(value, fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

const pickLangLabel = (node, lang) => {
  if (lang === 'en') return node.en_name || node.name;
  return node.name || node.en_name;
};

app.get('/', (req, res) => {
  res.send('Map of Science Backend Running');
});

app.get('/api/theories', async (req, res) => {
  const limit = Math.min(parseIntSafe(req.query.limit, 25), 500);
  const session = getSession();
  try {
    const result = await session.run('MATCH (n:Theory) RETURN n LIMIT $limit', { limit: neo4j.int(limit) });
    const theories = result.records.map((record) => normalizeTheoryNode(record.get('n')));
    res.json(theories);
  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    await session.close();
  }
});

app.get('/api/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const lang = String(req.query.lang || 'zh-CN');
  const limit = Math.min(parseIntSafe(req.query.limit, 20), 50);

  if (!q) return res.json([]);

  const cacheKey = `search:${lang}:${q}:${limit}`;
  const cached = await cacheGetJson(cacheKey);
  if (cached) return res.json(cached);

  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (n:Theory)
      WHERE toLower(n.name) CONTAINS toLower($q)
         OR (n.en_name IS NOT NULL AND toLower(n.en_name) CONTAINS toLower($q))
      RETURN n
      LIMIT $limit
      `,
      { q, limit: neo4j.int(limit) }
    );

    const items = result.records
      .map((r) => normalizeTheoryNode(r.get('n')))
      .map((n) => ({
        id: n.id,
        name: n.name,
        en_name: n.en_name,
        discipline: n.discipline,
        level: n.level,
        year: n.year,
        label: pickLangLabel(n, lang)
      }));

    await cacheSetJson(cacheKey, items, 30);
    res.json(items);
  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    await session.close();
  }
});

app.get('/api/entity/:id', async (req, res) => {
  const id = decodeURIComponent(String(req.params.id));
  const cacheKey = `entity:${id}`;
  const cached = await cacheGetJson(cacheKey);
  if (cached) return res.json(cached);

  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (n:Theory)
      WHERE n.id = $id OR n.name = $id
      RETURN n
      LIMIT 1
      `,
      { id }
    );
    if (!result.records.length) return res.status(404).send('Entity not found');
    const entity = normalizeTheoryNode(result.records[0].get('n'));
    await cacheSetJson(cacheKey, entity, 60);
    res.json(entity);
  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    await session.close();
  }
});

app.get('/api/entity/:id/neighbors', async (req, res) => {
  const id = decodeURIComponent(String(req.params.id));
  const direction = String(req.query.direction || 'both');
  const limit = Math.min(parseIntSafe(req.query.limit, 50), 300);
  const relTypesRaw = String(req.query.relTypes || '').trim();
  const relTypes = relTypesRaw ? relTypesRaw.split(',').map((s) => s.trim()).filter(Boolean) : null;

  const cacheKey = `neighbors:${id}:${direction}:${relTypesRaw}:${limit}`;
  const cached = await cacheGetJson(cacheKey);
  if (cached) return res.json(cached);

  const session = getSession();
  try {
    const pattern = direction === 'in' ? '<-[r]-' : direction === 'out' ? '-[r]->' : '-[r]-';

    const result = await session.run(
      `
      MATCH (n:Theory)
      WHERE n.id = $id OR n.name = $id
      MATCH (n)${pattern}(m:Theory)
      WHERE $relTypes IS NULL OR type(r) IN $relTypes
      RETURN n, r, m
      LIMIT $limit
      `,
      { id, relTypes, limit: neo4j.int(limit) }
    );

    const nodes = new Map();
    const links = [];
    result.records.forEach((record) => {
      const n = normalizeTheoryNode(record.get('n'));
      const m = normalizeTheoryNode(record.get('m'));
      const r = record.get('r');
      nodes.set(n.id, n);
      nodes.set(m.id, m);
      links.push(normalizeRelationship(r, n.id, m.id));
    });

    const payload = { nodes: Array.from(nodes.values()), links };
    await cacheSetJson(cacheKey, payload, 30);
    res.json(payload);
  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    await session.close();
  }
});

app.get('/api/graph', async (req, res) => {
  const limit = Math.min(parseIntSafe(req.query.limit, 300), 3000);
  const session = getSession();
  try {
    const result = await session.run(
      'MATCH (n:Theory)-[r]->(m:Theory) RETURN n, r, m LIMIT $limit',
      { limit: neo4j.int(limit) }
    );

    const nodes = new Map();
    const links = [];

    result.records.forEach((record) => {
      const source = normalizeTheoryNode(record.get('n'));
      const target = normalizeTheoryNode(record.get('m'));
      const rel = record.get('r');

      nodes.set(source.id, source);
      nodes.set(target.id, target);
      links.push(normalizeRelationship(rel, source.id, target.id));
    });

    res.json({ nodes: Array.from(nodes.values()), links });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  } finally {
    await session.close();
  }
});

app.get('/api/graph/viewport', async (req, res) => {
  const view = String(req.query.view || 'network');
  const centerId = String(req.query.centerId || '科学');
  const maxHops = clampInt(req.query.maxHops, 1, 6, view === 'tree' ? 3 : 2);
  const limit = Math.min(parseIntSafe(req.query.limit, 800), 5000);

  const cacheKey = `viewport:${view}:${centerId}:${maxHops}:${limit}`;
  const cached = await cacheGetJson(cacheKey);
  if (cached) return res.json(cached);

  const session = getSession();
  try {
    const hopRange = `1..${maxHops}`;
    const result = await session.run(
      `
      MATCH (c:Theory)
      WHERE c.id = $centerId OR c.name = $centerId
      MATCH (c)-[r*${hopRange}]-(n:Theory)
      WITH collect(distinct c) + collect(distinct n) AS ns, r
      UNWIND ns AS node
      WITH collect(distinct node) AS nodes
      MATCH (a:Theory)-[rel]->(b:Theory)
      WHERE a IN nodes AND b IN nodes
      RETURN a, rel, b
      LIMIT $limit
      `,
      { centerId, limit: neo4j.int(limit) }
    );

    const nodes = new Map();
    const links = [];
    result.records.forEach((record) => {
      const a = normalizeTheoryNode(record.get('a'));
      const b = normalizeTheoryNode(record.get('b'));
      const rel = record.get('rel');
      nodes.set(a.id, a);
      nodes.set(b.id, b);
      links.push(normalizeRelationship(rel, a.id, b.id));
    });
    const payload = { nodes: Array.from(nodes.values()), links };
    await cacheSetJson(cacheKey, payload, 20);
    res.json(payload);
  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    await session.close();
  }
});

app.get('/api/tree', async (req, res) => {
  const rootId = String(req.query.root || '科学');
  const depth = clampInt(req.query.depth, 0, 6, 3);

  const cacheKey = `tree:${rootId}:${depth}`;
  const cached = await cacheGetJson(cacheKey);
  if (cached) return res.json(cached);

  const session = getSession();
  try {
    const depthRange = `0..${depth}`;
    const result = await session.run(
      `
      MATCH (root:Theory)
      WHERE root.id = $rootId OR root.name = $rootId
      MATCH p=(root)-[:INCLUDES*${depthRange}]->(n:Theory)
      RETURN p
      `,
      { rootId }
    );

    const nodes = new Map();
    const edges = [];

    result.records.forEach((record) => {
      const path = record.get('p');
      path.segments.forEach((seg) => {
        const a = normalizeTheoryNode(seg.start);
        const b = normalizeTheoryNode(seg.end);
        nodes.set(a.id, a);
        nodes.set(b.id, b);
        edges.push({ fromId: a.id, toId: b.id, relType: seg.relationship.type });
      });
      nodes.set(normalizeTheoryNode(path.start).id, normalizeTheoryNode(path.start));
    });

    const childrenByParent = new Map();
    edges.forEach((e) => {
      if (e.relType !== 'INCLUDES') return;
      const list = childrenByParent.get(e.fromId) || [];
      list.push(e.toId);
      childrenByParent.set(e.fromId, list);
    });

    const build = (id, level) => {
      const n = nodes.get(id);
      if (!n) return null;
      const childIds = childrenByParent.get(id) || [];
      if (level >= depth) return { ...n, children: [] };
      const children = childIds
        .map((cid) => build(cid, level + 1))
        .filter(Boolean);
      return { ...n, children };
    };

    const tree = build(rootId, 0) || build('科学', 0);
    if (!tree) return res.status(404).send('Root not found');
    await cacheSetJson(cacheKey, tree, 60);
    res.json(tree);
  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    await session.close();
  }
});

app.get('/api/timeline', async (req, res) => {
  const yearFrom = parseIntSafe(req.query.yearFrom, 1500);
  const yearTo = parseIntSafe(req.query.yearTo, new Date().getFullYear());
  const limit = Math.min(parseIntSafe(req.query.limit, 500), 3000);

  const cacheKey = `timeline:${yearFrom}:${yearTo}:${limit}`;
  const cached = await cacheGetJson(cacheKey);
  if (cached) return res.json(cached);

  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (n:Theory)
      WHERE n.year IS NOT NULL AND n.year >= $yearFrom AND n.year <= $yearTo
      RETURN n
      ORDER BY n.year ASC
      LIMIT $limit
      `,
      { yearFrom, yearTo, limit: neo4j.int(limit) }
    );

    const items = result.records.map((r) => normalizeTheoryNode(r.get('n')));
    await cacheSetJson(cacheKey, items, 60);
    res.json(items);
  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    await session.close();
  }
});

const runPathQuery = async ({ startId, endId, strategy, allowedRelTypes, yearRange, maxHops }) => {
  const session = getSession();
  try {
    const maxHopsSafe = clampInt(maxHops, 1, 20, 10);
    const fromYear = yearRange && Number.isFinite(yearRange.from) ? yearRange.from : null;
    const toYear = yearRange && Number.isFinite(yearRange.to) ? yearRange.to : null;
    const allowRel = allowedRelTypes && allowedRelTypes.length ? allowedRelTypes : null;

    const matchStartEnd = `
      MATCH (start:Theory)
      WHERE start.id = $startId OR start.name = $startId
      MATCH (end:Theory)
      WHERE end.id = $endId OR end.name = $endId
    `;

    const whereRel = `($allowRel IS NULL OR type(x) IN $allowRel)`;
    const whereYear = `($fromYear IS NULL OR coalesce(x.year, start.year, end.year) >= $fromYear)
                      AND ($toYear IS NULL OR coalesce(x.year, start.year, end.year) <= $toYear)`;

    const hopRange = `..${maxHopsSafe}`;
    const where =
      strategy === 'time_constrained'
        ? `all(x IN r WHERE ${whereRel} AND ${whereYear})`
        : `all(x IN r WHERE ${whereRel})`;

    const query =
      `
        ${matchStartEnd}
        MATCH p = shortestPath((start)-[r*${hopRange}]-(end))
        WHERE ${where}
        RETURN p
        LIMIT 1
      `;

    const result = await session.run(query, {
      startId,
      endId,
      allowRel,
      fromYear,
      toYear
    });

    if (!result.records.length) return null;
    const path = result.records[0].get('p');

    const nodes = new Map();
    const links = [];
    const addNode = (node) => {
      const n = normalizeTheoryNode(node);
      nodes.set(n.id, n);
    };
    addNode(path.start);
    addNode(path.end);
    path.segments.forEach((seg) => {
      addNode(seg.start);
      addNode(seg.end);
      const a = normalizeTheoryNode(seg.start);
      const b = normalizeTheoryNode(seg.end);
      links.push(normalizeRelationship(seg.relationship, a.id, b.id));
    });
    return { nodes: Array.from(nodes.values()), links };
  } finally {
    await session.close();
  }
};

app.get('/api/path', async (req, res) => {
  const startId = String(req.query.start || '').trim();
  const endId = String(req.query.end || '').trim();
  if (!startId || !endId) return res.status(400).send('start and end are required');
  try {
    const data = await runPathQuery({ startId, endId, strategy: 'shortest', maxHops: 10 });
    if (!data) return res.status(404).send('No path found');
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

app.post('/api/path/query', async (req, res) => {
  const body = req.body || {};
  const startId = String(body.startId || '').trim();
  const endId = String(body.endId || '').trim();
  const strategy = body.strategy === 'time_constrained' ? 'time_constrained' : 'shortest';
  const allowedRelTypes = Array.isArray(body.allowedRelTypes) ? body.allowedRelTypes.map(String) : undefined;
  const yearRange = body.yearRange && typeof body.yearRange === 'object' ? body.yearRange : undefined;
  const maxHops = body.maxHops;
  if (!startId || !endId) return res.status(400).send('startId and endId are required');

  const cacheKey = `path:${strategy}:${startId}:${endId}:${String(allowedRelTypes || '')}:${JSON.stringify(yearRange || {})}:${String(maxHops || '')}`;
  const cached = await cacheGetJson(cacheKey);
  if (cached) return res.json(cached);

  try {
    const data = await runPathQuery({ startId, endId, strategy, allowedRelTypes, yearRange, maxHops });
    if (!data) return res.status(404).send('No path found');
    await cacheSetJson(cacheKey, data, 30);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const shutdown = async () => {
  try {
    await redisClient.quit();
  } catch {}
  try {
    await neo4jDriver.close();
  } catch {}
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
