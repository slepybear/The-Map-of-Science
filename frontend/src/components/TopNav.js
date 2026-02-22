import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SearchBox from './SearchBox';

export default function TopNav({ lang, onChangeLang, onPickSearch }) {
  const loc = useLocation();
  const nav = useNavigate();
  const title = lang === 'en' ? 'THE MAP OF SCIENCE' : 'THE MAP OF SCIENCE · 科学图谱';

  return (
    <header className="topbar">
      <div className="topbar__left">
        <Link to="/" className="brand">
          <div className="brand__mark" />
          <div className="brand__text">{title}</div>
        </Link>
      </div>
      <div className="topbar__center">
        <SearchBox
          lang={lang}
          placeholder={lang === 'en' ? 'Search a theory…' : '搜索理论/学科…'}
          onPick={(it) => {
            onPickSearch(it);
            nav(`/entity/${encodeURIComponent(it.id)}`);
          }}
        />
      </div>
      <div className="topbar__right">
        <button type="button" className="btn btn--ghost" onClick={() => onChangeLang(lang === 'en' ? 'zh-CN' : 'en')}>
          {lang === 'en' ? 'EN' : 'ZH'}
        </button>
        <Link className={loc.pathname === '/account' ? 'btn btn--primary' : 'btn btn--secondary'} to="/account">
          {lang === 'en' ? 'Account' : '账户'}
        </Link>
      </div>
    </header>
  );
}

