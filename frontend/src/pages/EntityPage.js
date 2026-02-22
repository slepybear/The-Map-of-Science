import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

export default function EntityPage({ prefs }) {
  const { id } = useParams();
  const [entity, setEntity] = useState(null);
  const [neighbors, setNeighbors] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let live = true;
    setLoading(true);
    const run = async () => {
      try {
        const resp = await api.get(`/api/entity/${id}`);
        const neighborResp = await api.get(`/api/entity/${id}/neighbors`, { params: { direction: 'both', limit: 80 } });
        if (!live) return;
        setEntity(resp.data);
        setNeighbors(neighborResp.data);
      } finally {
        if (live) setLoading(false);
      }
    };
    run();
    return () => {
      live = false;
    };
  }, [id]);

  const neighborList = useMemo(() => {
    const nodes = Array.isArray(neighbors.nodes) ? neighbors.nodes : [];
    const links = Array.isArray(neighbors.links) ? neighbors.links : [];
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const items = links
      .map((l) => {
        const otherId = l.source === (entity?.id || entity?.name) ? l.target : l.source;
        return {
          relType: l.type,
          description: l.description,
          node: byId.get(otherId)
        };
      })
      .filter((x) => x.node);
    items.sort((a, b) => (a.node.level || 9) - (b.node.level || 9));
    return items;
  }, [neighbors, entity]);

  if (loading && !entity) return <div className="page">Loading…</div>;

  if (!entity) {
    return (
      <div className="page">
        <div className="card">
          <div className="card__title">Not Found</div>
          <Link to="/" className="btn btn--secondary">
            Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <Link to="/" className="btn btn--secondary">
          {prefs.lang === 'en' ? 'Back' : '返回地图'}
        </Link>
      </div>

      <div className="entityGrid">
        <div className="card">
          <div className="card__title">{entity.name}</div>
          {entity.en_name ? <div className="card__subtitle">{entity.en_name}</div> : null}
          <div className="kv">
            <div className="kv__row">
              <div className="kv__k">{prefs.lang === 'en' ? 'Discipline' : '学科'}</div>
              <div className="kv__v">{entity.discipline || '-'}</div>
            </div>
            <div className="kv__row">
              <div className="kv__k">{prefs.lang === 'en' ? 'Level' : '层级'}</div>
              <div className="kv__v">{typeof entity.level === 'number' ? entity.level : '-'}</div>
            </div>
            <div className="kv__row">
              <div className="kv__k">{prefs.lang === 'en' ? 'Year' : '时间'}</div>
              <div className="kv__v">{typeof entity.year === 'number' ? entity.year : '-'}</div>
            </div>
          </div>
          {entity.description ? <div className="card__body">{entity.description}</div> : null}
        </div>

        <div className="card">
          <div className="card__title">{prefs.lang === 'en' ? 'Relations' : '关系'}</div>
          <div className="relList">
            {neighborList.slice(0, 30).map((it, idx) => (
              <Link key={`${it.node.id}-${idx}`} to={`/entity/${encodeURIComponent(it.node.id)}`} className="relItem">
                <div className="relItem__main">
                  <div className="relItem__name">{it.node.name}</div>
                  {it.node.en_name ? <div className="relItem__sub">{it.node.en_name}</div> : null}
                </div>
                <div className="relItem__meta">
                  <div className="pill">{it.relType}</div>
                  {it.description ? <div className="relItem__desc">{it.description}</div> : null}
                </div>
              </Link>
            ))}
            {!neighborList.length ? <div className="relEmpty">No relations</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

