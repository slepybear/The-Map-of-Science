import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

export default function SearchBox({ lang, value, onPick, placeholder }) {
  const [query, setQuery] = useState(value || '');
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    let live = true;
    const q = query.trim();
    if (!q) {
      setItems([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const resp = await api.get('/api/search', { params: { q, lang, limit: 12 } });
        if (!live) return;
        setItems(Array.isArray(resp.data) ? resp.data : []);
        setOpen(true);
      } finally {
        if (live) setLoading(false);
      }
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [query, lang]);

  const display = useMemo(() => items.slice(0, 12), [items]);

  return (
    <div className="search" onBlur={() => setTimeout(() => setOpen(false), 120)}>
      <input
        className="search__input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="search"
      />
      {loading ? <div className="search__hint">…</div> : null}
      {open && display.length ? (
        <div className="search__dropdown" role="listbox">
          {display.map((it) => (
            <button
              key={it.id}
              type="button"
              className="search__item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQuery(it.label || it.name);
                setOpen(false);
                onPick(it);
              }}
              role="option"
              aria-selected={false}
            >
              <div className="search__itemTitle">{it.label || it.name}</div>
              <div className="search__itemMeta">
                {it.discipline ? <span>{it.discipline}</span> : null}
                {typeof it.year === 'number' ? <span>· {it.year}</span> : null}
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
