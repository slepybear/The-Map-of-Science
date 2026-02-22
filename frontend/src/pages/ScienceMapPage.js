import React, { useMemo, useState, useEffect } from 'react';
import StarryBackground from '../components/StarryBackground';
import ScienceTreeGraph from '../components/ScienceTree/ScienceTreeGraph';
import DetailSidebar from '../components/DetailSidebar';
import scienceTreeData from '../data/scienceTreeData.json';

const ScienceMapPage = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [lang, setLang] = useState('zh');
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(false);

  // Initialize collapsed state
  useEffect(() => {
    const initialCollapsed = new Set();
    const traverse = (node, depth = 0) => {
        if (depth >= 2 && node.children && node.children.length > 0) {
            initialCollapsed.add(node.id);
        }
        if (node.children) {
            node.children.forEach(child => traverse(child, depth + 1));
        }
    };
    traverse(scienceTreeData);
    setCollapsedNodes(initialCollapsed);
  }, []);

  const handleToggleExpand = () => {
    if (isAllExpanded) {
      // 收起
      const initial = new Set();
      const traverse = (n, depth = 0) => {
        if (depth >= 2 && n.children && n.children.length > 0) {
          initial.add(n.id);
        }
        if (n.children) n.children.forEach(c => traverse(c, depth + 1));
      };
      traverse(scienceTreeData);
      setCollapsedNodes(initial);
      setIsAllExpanded(false);
    } else {
      // 全开
      setCollapsedNodes(new Set());
      setIsAllExpanded(true);
    }
  };

  const t = useMemo(() => {
    if (lang === 'en') {
      return {
        title: 'Science Map',
        subtitle: 'Click nodes to explore the frontier of knowledge',
        expandAll: isAllExpanded ? 'Collapse All' : 'Expand All',
        zh: '中文',
        en: 'English'
      };
    }
    return {
      title: '科学地图',
      subtitle: '点击节点探索人类知识边界',
      expandAll: isAllExpanded ? '全收' : '全开',
      zh: '中文',
      en: 'English'
    };
  }, [lang, isAllExpanded]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };
  
  const handleNodeCollapse = (newSet) => {
      setCollapsedNodes(newSet);
  };

  const handleCloseSidebar = () => {
    setSelectedNode(null);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <StarryBackground />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
         <ScienceTreeGraph 
            onNodeClick={handleNodeClick} 
            lang={lang} 
            collapsedNodes={collapsedNodes}
            onNodeCollapse={handleNodeCollapse}
         />
      </div>
      <DetailSidebar 
        isOpen={!!selectedNode} 
        node={selectedNode} 
        onClose={handleCloseSidebar} 
        lang={lang}
      />
      <div style={{ 
        position: 'absolute', 
        top: 30, 
        left: 30, 
        zIndex: 2, 
        color: 'white', 
        pointerEvents: 'none',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '20px 30px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          margin: '0 0 8px 0', 
          fontWeight: 700,
          letterSpacing: '-1px',
          background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>{t.title}</h1>
        <p style={{ 
          fontSize: '1rem', 
          margin: 0, 
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: 300 
        }}>{t.subtitle}</p>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 140,
          left: 30,
          zIndex: 1101,
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <button
          type="button"
          onClick={handleToggleExpand}
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '10px 14px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          {t.expandAll}
        </button>

        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          <button
            type="button"
            onClick={() => setLang('zh')}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: 'none',
              cursor: 'pointer',
              background: lang === 'zh' ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
              color: 'white',
              fontWeight: 600
            }}
          >
            {t.zh}
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: 'none',
              cursor: 'pointer',
              background: lang === 'en' ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
              color: 'white',
              fontWeight: 600
            }}
          >
            {t.en}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScienceMapPage;
