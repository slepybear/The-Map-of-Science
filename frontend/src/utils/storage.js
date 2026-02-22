const KEY = 'mos:prefs:v1';

export const defaultPrefs = {
  lang: 'zh-CN',
  defaultView: 'network',
  lowPerf: false
};

export const loadPrefs = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultPrefs;
    const parsed = JSON.parse(raw);
    return {
      ...defaultPrefs,
      ...parsed
    };
  } catch {
    return defaultPrefs;
  }
};

export const savePrefs = (prefs) => {
  localStorage.setItem(KEY, JSON.stringify(prefs));
};

