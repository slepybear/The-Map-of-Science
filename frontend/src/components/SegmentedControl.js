import React from 'react';

export default function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="segmented" role="tablist" aria-label="view">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            className={active ? 'segmented__btn segmented__btn--active' : 'segmented__btn'}
            onClick={() => onChange(opt.value)}
            role="tab"
            aria-selected={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

