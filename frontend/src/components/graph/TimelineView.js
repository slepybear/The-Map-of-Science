import React, { useMemo } from 'react';

export default function TimelineView({ items, onPick }) {
  const list = useMemo(() => {
    const arr = Array.isArray(items) ? items.slice() : [];
    arr.sort((a, b) => (a.year || 0) - (b.year || 0));
    return arr;
  }, [items]);

  return (
    <div className="timeline">
      <div className="timeline__header">Timeline</div>
      <div className="timeline__list">
        {list.map((it) => (
          <button key={it.id} type="button" className="timeline__item" onClick={() => onPick?.(it)}>
            <div className="timeline__year">{it.year}</div>
            <div className="timeline__name">
              <div className="timeline__title">{it.name}</div>
              {it.en_name ? <div className="timeline__sub">{it.en_name}</div> : null}
            </div>
          </button>
        ))}
        {!list.length ? <div className="timeline__empty">No data</div> : null}
      </div>
    </div>
  );
}

