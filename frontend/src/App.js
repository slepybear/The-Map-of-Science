import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import GraphVisualization from './components/GraphVisualization';
import TimelineView from './components/TimelineView';
import SearchBox from './components/SearchBox';
import SegmentedControl from './components/SegmentedControl';
import DetailPanel from './components/DetailPanel';
import ScienceMapPage from './pages/ScienceMapPage';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function Home() {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [view, setView] = useState('graph'); // 'graph' | 'timeline'
  const [lang, setLang] = useState('zh-CN');
  const [selectedNode, setSelectedNode] = useState(null);
  const [pathData, setPathData] = useState(null);

  const fetchGraph = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/graph`);
      console.log('Fetched data:', response.data);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  const handleSearchPick = (item) => {
    console.log('Picked:', item);
    setSelectedNode(item);
    // Optionally fetch full details if item only has summary
  };

  const handleNodeSelect = (node) => {
    setSelectedNode(node);
  };

  const handleTracePath = async (node) => {
    try {
      // Find path from 'Science' (root) to this node
      // Assuming 'Science' or '科学' is the root
      const rootId = '科学'; 
      const response = await axios.get(`${API_URL}/api/path`, {
        params: { start: rootId, end: node.name }
      });
      setPathData(response.data);
      console.log('Path found:', response.data);
    } catch (error) {
      console.error('Error tracing path:', error);
      alert('未找到推导路径');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-left">
          <h1 style={{ letterSpacing: '1px', margin: 0 }}>THE MAP OF SCIENCE · 科学图谱</h1>
        </div>
        <div className="header-center">
          <SearchBox 
            placeholder="搜索科学理论..." 
            onPick={handleSearchPick}
            lang={lang}
          />
        </div>
        <div className="header-right">
          <SegmentedControl 
            options={[
              { label: '图谱视图', value: 'graph' },
              { label: '时间轴', value: 'timeline' }
            ]}
            value={view}
            onChange={setView}
          />
          <button onClick={() => { setPathData(null); fetchGraph(); }} style={{ fontSize: '12px', marginLeft: '10px' }}>⟳ 重置</button>
          <Link to="/map" style={{ color: 'white', marginLeft: '15px', textDecoration: 'none', fontSize: '14px', border: '1px solid white', padding: '4px 8px', borderRadius: '4px' }}>星空视图</Link>
        </div>
      </header>
      <main>
        {view === 'graph' ? (
          <GraphVisualization 
            data={data} 
            onNodeSelect={handleNodeSelect}
            pathData={pathData}
          />
        ) : (
          <TimelineView />
        )}
        <DetailPanel 
          node={selectedNode} 
          onClose={() => setSelectedNode(null)}
          onTracePath={handleTracePath}
        />
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<ScienceMapPage />} />
      </Routes>
    </Router>
  );
}

export default App;
