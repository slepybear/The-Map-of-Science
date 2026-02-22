import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { savePrefs } from '../utils/storage';

export default function AccountPage({ prefs, setPrefs }) {
  const [email, setEmail] = useState('');

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  return (
    <div className="page">
      <div className="page__header">
        <Link to="/" className="btn btn--secondary">
          {prefs.lang === 'en' ? 'Back' : '返回地图'}
        </Link>
      </div>

      <div className="pageNarrow">
        <div className="card">
          <div className="card__title">{prefs.lang === 'en' ? 'Account (MVP)' : '账户（MVP）'}</div>
          <div className="card__body">
            <div className="field">
              <div className="field__label">Email</div>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="hint">
              {prefs.lang === 'en'
                ? 'MVP stores preferences locally; auth endpoints can be added later.'
                : 'MVP 先本地保存偏好；后续可接入后端认证与云端同步。'}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__title">{prefs.lang === 'en' ? 'Preferences' : '偏好设置'}</div>
          <div className="card__body">
            <div className="field">
              <div className="field__label">{prefs.lang === 'en' ? 'Language' : '语言'}</div>
              <select className="input" value={prefs.lang} onChange={(e) => setPrefs((p) => ({ ...p, lang: e.target.value }))}>
                <option value="zh-CN">中文</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="field">
              <div className="field__label">{prefs.lang === 'en' ? 'Default view' : '默认视图'}</div>
              <select
                className="input"
                value={prefs.defaultView}
                onChange={(e) => setPrefs((p) => ({ ...p, defaultView: e.target.value }))}
              >
                <option value="network">{prefs.lang === 'en' ? 'Network' : '网'}</option>
                <option value="tree">{prefs.lang === 'en' ? 'Tree' : '树'}</option>
                <option value="timeline">{prefs.lang === 'en' ? 'Timeline' : '时间线'}</option>
              </select>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={!!prefs.lowPerf} onChange={(e) => setPrefs((p) => ({ ...p, lowPerf: e.target.checked }))} />
              <span>{prefs.lang === 'en' ? 'Low-perf mode' : '低配模式'}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

