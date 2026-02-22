import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import PanelTabs from '../components/PanelTabs';
import SegmentedControl from '../components/SegmentedControl';
import SearchBox from '../components/SearchBox';
import NetworkGraph from '../components/graph/NetworkGraph';
import TreeGraph from '../components/graph/TreeGraph';
import TimelineView from '../components/graph/TimelineView';

const keyOf = (a, b) => `${a}→${b}`;

export default function ExplorerPage({ prefs, setPrefs }) {
  const nav = useNavigate();
  const [view, setView] = useState(prefs.defaultView || 'network');
  const [panel, setPanel] = useState('browse');
  const [center, setCenter] = useState('科学');

  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [tree, setTree] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);

  const [startPick, setStartPick] = useState(null);
  const [endPick, setEndPick] = useState(null);
  const [path, setPath] = useState({ nodes: [], links: [] });
  const [pathError, setPathError] = useState('');

  useEffect(() => {
    setPrefs((p) => ({ ...p, defaultView: view }));
  }, [view, setPrefs]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    const run = async () => {
      try {
        if (view === 'tree') {
          const resp = await api.get('/api/tree', { params: { root: center, depth: 3 } });
          if (!live) return;
          setTree(resp.data);
        } else if (view === 'timeline') {
          const resp = await api.get('/api/timeline', { params: { yearFrom: 1700, yearTo: 2025, limit: 200 } });
          if (!live) return;
          setTimeline(Array.isArray(resp.data) ? resp.data : []);
        } else {
          const resp = await api.get('/api/graph/viewport', { params: { view: 'network', centerId: center, maxHops: 2, limit: 1200 } });
          if (!live) return;
          setGraph(resp.data);
        }
      } finally {
        if (live) setLoading(false);
      }
    };
    run();
    return () => {
      live = false;
    };
  }, [view, center]);

  const highlightedNodes = useMemo(() => {
    const s = new Set();
    (path.nodes || []).forEach((n) => s.add(n.id));
    return s;
  }, [path.nodes]);

  const highlightedLinks = useMemo(() => {
    const s = new Set();
    (path.links || []).forEach((l) => s.add(keyOf(l.source, l.target)));
    return s;
  }, [path.links]);

  const runPath = async () => {
    setPathError('');
    if (!startPick?.id || !endPick?.id) {
      setPathError('请选择起点与终点');
      return;
    }
    try {
      const resp = await api.post('/api/path/query', {
        startId: startPick.id,
        endId: endPick.id,
        strategy: 'shortest',
        maxHops: 12
      });
      setPath(resp.data);
      if (view !== 'network') setView('network');
      setPanel('path');
    } catch (e) {
      setPath({ nodes: [], links: [] });
      setPathError('未找到路径或查询失败');
    }
  };

  const handleGraphNodeClick = (n, event) => {
    if (event?.shiftKey) {
      if (!startPick) setStartPick({ id: n.id, name: n.name, label: n.name, en_name: n.en_name });
      else if (!endPick) setEndPick({ id: n.id, name: n.name, label: n.name, en_name: n.en_name });
      else {
        setStartPick({ id: n.id, name: n.name, label: n.name, en_name: n.en_name });
        setEndPick(null);
      }
      setPanel('path');
      return;
    }
    nav(`/entity/${encodeURIComponent(n.id || n.name)}`);
  };

  const tabs = [
    {
      key: 'browse',
      label: prefs.lang === 'en' ? 'Browse' : '浏览',
      content: (
        <div className="panelSection">
          <div className="panelRow">
            <div className="panelLabel">{prefs.lang === 'en' ? 'View' : '视图'}</div>
            <SegmentedControl
              value={view}
              onChange={(v) => {
                setPath({ nodes: [], links: [] });
                setView(v);
              }}
              options={[
                { value: 'network', label: prefs.lang === 'en' ? 'Network' : '网' },
                { value: 'tree', label: prefs.lang === 'en' ? 'Tree' : '树' },
                { value: 'timeline', label: prefs.lang === 'en' ? 'Timeline' : '时间线' }
              ]}
            />
          </div>
          <div className="panelRow">
            <div className="panelLabel">{prefs.lang === 'en' ? 'Center' : '中心节点'}</div>
            <SearchBox
              lang={prefs.lang}
              value={center}
              placeholder={prefs.lang === 'en' ? 'Pick a center…' : '选择中心节点…'}
              onPick={(it) => setCenter(it.id)}
            />
          </div>
          <div className="panelRow">
            <div className="panelLabel">{prefs.lang === 'en' ? 'Performance' : '性能'}</div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={!!prefs.lowPerf}
                onChange={(e) => setPrefs((p) => ({ ...p, lowPerf: e.target.checked }))}
              />
              <span>{prefs.lang === 'en' ? 'Low-perf mode' : '低配模式'}</span>
            </label>
          </div>
        </div>
      )
    },
    {
      key: 'path',
      label: prefs.lang === 'en' ? 'Path' : '路径追踪',
      content: (
        <div className="panelSection">
          <div className="panelRow">
            <div className="panelLabel">{prefs.lang === 'en' ? 'Start' : '起点'}</div>
            <SearchBox
              lang={prefs.lang}
              value={startPick?.label || ''}
              placeholder={prefs.lang === 'en' ? 'Search start…' : '搜索起点…'}
              onPick={(it) => setStartPick(it)}
            />
          </div>
          <div className="panelRow">
            <div className="panelLabel">{prefs.lang === 'en' ? 'End' : '终点'}</div>
            <SearchBox
              lang={prefs.lang}
              value={endPick?.label || ''}
              placeholder={prefs.lang === 'en' ? 'Search end…' : '搜索终点…'}
              onPick={(it) => setEndPick(it)}
            />
          </div>
          <div className="panelActions">
            <button type="button" className="btn btn--primary" onClick={runPath}>
              {prefs.lang === 'en' ? 'Query Path' : '查询路径'}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                setPath({ nodes: [], links: [] });
                setPathError('');
              }}
            >
              {prefs.lang === 'en' ? 'Clear' : '清除'}
            </button>
          </div>
          {pathError ? <div className="panelError">{pathError}</div> : null}
          {path.nodes?.length ? (
            <div className="panelHint">
              {prefs.lang === 'en' ? 'Steps' : '节点数'}: {path.nodes.length} · {prefs.lang === 'en' ? 'Edges' : '边数'}: {path.links.length}
            </div>
          ) : null}
        </div>
      )
    },
    {
      key: 'learn',
      label: prefs.lang === 'en' ? 'Learn' : '学习',
      content: (
        <div className="panelSection">
          <div className="panelHint">{prefs.lang === 'en' ? 'MVP uses local-only learning preferences.' : 'MVP 阶段学习模式先提供本地偏好与路径记录。'}</div>
          <div className="panelActions">
            <button type="button" className="btn btn--secondary" onClick={() => nav('/account')}>
              {prefs.lang === 'en' ? 'Open Account' : '打开账户页'}
            </button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="explorer">
      <aside className="panel">
        <PanelTabs tabs={tabs} active={panel} onChange={setPanel} />
      </aside>
      <section className="canvas">
        {loading ? <div className="canvas__loading">Loading…</div> : null}
        {view === 'tree' ? (
          <TreeGraph
            tree={tree}
            highlightedNodes={highlightedNodes}
            onNodeClick={handleGraphNodeClick}
          />
        ) : view === 'timeline' ? (
          <TimelineView items={timeline} onPick={(n) => nav(`/entity/${encodeURIComponent(n.id)}`)} />
        ) : (
          <NetworkGraph
            data={graph}
            lowPerf={!!prefs.lowPerf}
            highlightedNodes={highlightedNodes}
            highlightedLinks={highlightedLinks}
            onNodeClick={handleGraphNodeClick}
          />
        )}
      </section>
    </div>
  );
}
