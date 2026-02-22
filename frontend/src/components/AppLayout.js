import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';

export default function AppLayout({ lang, onChangeLang, onPickSearch }) {
  return (
    <div className="app">
      <TopNav lang={lang} onChangeLang={onChangeLang} onPickSearch={onPickSearch} />
      <div className="app__body">
        <Outlet />
      </div>
    </div>
  );
}

