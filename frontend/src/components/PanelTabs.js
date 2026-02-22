import React from 'react';

export default function PanelTabs({ tabs, active, onChange }) {
  return (
    <div className="panelTabs">
      <div className="panelTabs__header" role="tablist" aria-label="panel tabs">
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              className={isActive ? 'panelTabs__tab panelTabs__tab--active' : 'panelTabs__tab'}
              onClick={() => onChange(t.key)}
              role="tab"
              aria-selected={isActive}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="panelTabs__body">{tabs.find((t) => t.key === active)?.content}</div>
    </div>
  );
}

