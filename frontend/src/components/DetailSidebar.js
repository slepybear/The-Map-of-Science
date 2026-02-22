import React from 'react';

// Helper component for rendering detail sections
const DetailSection = ({ title, content }) => {
  if (!content) return null;

  let renderContent = content;
  if (Array.isArray(content)) {
    renderContent = (
      <ul style={{ paddingLeft: '20px', margin: 0 }}>
        {content.map((item, index) => (
          <li key={index} style={{ marginBottom: '8px' }}>
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#61dafb', textDecoration: 'none' }}
              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              {item.title}
            </a>
            {item.author && item.year && (
              <span style={{ color: '#aaa', fontSize: '0.9em' }}>
                {' '}({item.author}, {item.year})
              </span>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div style={{ marginBottom: '25px' }}>
      <h3 style={{ 
        color: '#61dafb', // React blue-ish, stands out nicely in dark mode
        fontSize: '1.1rem', 
        marginBottom: '8px',
        borderBottom: '1px solid #444',
        paddingBottom: '4px',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        {title}
      </h3>
      <div style={{ 
        color: '#e0e0e0', 
        fontSize: '0.95rem', 
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap'
      }}>
        {renderContent}
      </div>
    </div>
  );
};

const DetailSidebar = ({ isOpen, node, onClose, lang = 'zh' }) => {
  const t = lang === 'en'
    ? {
        definition: 'Definition',
        theory: 'Theory',
        equations: 'Equations',
        papers: 'Key Papers',
        history: 'History',
        usage: 'Applications',
        pickNode: 'Select a node to view details.',
        example: 'Select “Science” or “Calculus” to see an example.'
      }
    : {
        definition: '定义',
        theory: '理论',
        equations: '公式',
        papers: '关键论文',
        history: '历史',
        usage: '应用',
        pickNode: '从图谱中选择一个节点以查看详情。',
        example: '选择“科学”或“微积分”查看详细示例。'
      };

  const getNodeName = (n) => {
    if (!n) return '';
    if (lang === 'en') return n.name_en || n.name;
    return n.name;
  };

  const getNodeDescription = (n) => {
    if (!n) return null;
    if (lang === 'en') return n.description_en || n.description;
    return n.description || n.description_en;
  };

  const getDetail = (n, key) => {
    const d = n?.details;
    if (!d) return null;
    if (lang === 'en') return d[`${key}_en`] || d[key];
    return d[key] || d[`${key}_en`];
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '380px', // Slightly wider
        height: '100%',
        backgroundColor: 'rgba(30, 30, 36, 0.7)', // More transparent
        backdropFilter: 'blur(12px)', // Glassmorphism effect
        WebkitBackdropFilter: 'blur(12px)',
        color: 'white',
        boxShadow: '4px 0 20px rgba(0,0,0,0.5)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)', // Smoother transition
        zIndex: 1000,
        padding: '30px',
        overflowY: 'auto',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)' // Subtle border
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '1.2rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        &times;
      </button>

      {node ? (
        <div style={{ marginTop: '40px', fontFamily: "'Inter', sans-serif" }}>
          <h2 style={{ 
            borderBottom: `2px solid ${node.color || '#555'}`, 
            paddingBottom: '15px', 
            marginBottom: '25px',
            fontSize: '2rem',
            fontWeight: '700',
            color: node.color || 'white',
            letterSpacing: '-0.5px',
            textShadow: `0 0 20px ${node.color}40` // Subtle text glow
          }}>
            {getNodeName(node)}
          </h2>
          
          {/* Metadata Section */}
          <div style={{ 
            marginBottom: '30px', 
            background: 'rgba(255,255,255,0.05)', 
            padding: '15px', 
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
             <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>ID:</span>
                <span style={{ fontFamily: 'monospace', color: '#ccc' }}>{node.id}</span>
             </div>
             {node.val && (
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>Value:</span>
                  <span style={{ color: '#ccc' }}>{node.val}</span>
               </div>
             )}
          </div>

          {/* Render Sections including Definition from description */}
          <div>
            <DetailSection title={t.definition} content={getDetail(node, 'definition') || getNodeDescription(node)} />
            
            {node.details && (
              <>
                <DetailSection title={t.theory} content={getDetail(node, 'theory')} />
                <DetailSection title={t.equations} content={getDetail(node, 'equations')} />
                <DetailSection title={t.papers} content={getDetail(node, 'papers')} />
                <DetailSection title={t.history} content={getDetail(node, 'history')} />
                <DetailSection title={t.usage} content={getDetail(node, 'usage')} />
              </>
            )}
          </div>

          {/* Fallback/Footer text */}
          {!node.description && !node.details && (
             <div style={{ marginTop: '30px', color: '#888', fontSize: '0.9rem', textAlign: 'center', fontStyle: 'italic' }}>
               <p>{t.example}</p>
             </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: '100px', textAlign: 'center', color: '#666' }}>
          <p>{t.pickNode}</p>
        </div>
      )}
    </div>
  );
};

export default DetailSidebar;
