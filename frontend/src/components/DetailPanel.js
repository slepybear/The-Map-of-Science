import React from 'react';

const DetailPanel = ({ node, onClose, onTracePath }) => {
  if (!node) return null;

  return (
    <div className="detail-panel">
      <button className="detail-panel__close" onClick={onClose}>×</button>
      
      <div className="detail-panel__header">
        <h2>{node.name}</h2>
        {node.en_name && <div className="detail-panel__subtitle">{node.en_name}</div>}
      </div>

      <div className="detail-panel__content">
        <div className="detail-item">
          <label>学科</label>
          <span>{node.discipline}</span>
        </div>
        
        {node.year > 0 && (
          <div className="detail-item">
            <label>年份</label>
            <span>{node.year}</span>
          </div>
        )}

        <div className="detail-item">
          <label>描述</label>
          <p>{node.description}</p>
        </div>

        {node.keywords && (
          <div className="detail-item">
            <label>关键词</label>
            <div className="tags">
              {node.keywords.split(',').map((k, i) => (
                <span key={i} className="tag">{k.trim()}</span>
              ))}
            </div>
          </div>
        )}

        {node.doi && (
          <div className="detail-item">
            <label>DOI</label>
            <a href={`https://doi.org/${node.doi}`} target="_blank" rel="noopener noreferrer">
              {node.doi}
            </a>
          </div>
        )}

        {node.citation_growth !== undefined && (
          <div className="detail-item">
            <label>关注度增长</label>
            <div className="growth-indicator">
              <div 
                className="growth-bar" 
                style={{ width: `${Math.min(node.citation_growth * 5, 100)}%` }}
              ></div>
              <span>{node.citation_growth}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="detail-panel__actions">
        <button className="btn-primary" onClick={() => onTracePath(node)}>
          🔍 追踪推导路径
        </button>
      </div>
    </div>
  );
};

export default DetailPanel;
