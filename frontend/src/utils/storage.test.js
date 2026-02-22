import { defaultPrefs, loadPrefs, savePrefs } from './storage';

describe('storage prefs', () => {
  test('loadPrefs returns defaults when empty', () => {
    localStorage.clear();
    expect(loadPrefs()).toEqual(defaultPrefs);
  });

  test('savePrefs persists and merges with defaults', () => {
    localStorage.clear();
    savePrefs({ lang: 'en' });
    expect(loadPrefs()).toEqual({ ...defaultPrefs, lang: 'en' });
  });
});

