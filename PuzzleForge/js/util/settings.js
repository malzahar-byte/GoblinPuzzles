// The Puzzle Forge landing page's own settings: wraps the shared Goblin Does Puzzles settings
// store. Made from shared/puzzle-template/settings.js — see that file for the rule this exists
// to enforce. The Forge is theme-only for now (just the landing page itself).
import { createSettingsStore, currentTheme as gdpCurrentTheme, applyTheme as gdpApplyTheme, setupThemeButton as gdpSetupThemeButton } from '../../../shared/gdp-settings.js';

const KEY = 'gdp-forge-settings';
export const SETTINGS_KEY = KEY; // the ONLY place this string is allowed to be written

const DEFAULTS = { theme: null };

const store = createSettingsStore(KEY, DEFAULTS);

export const loadSettings = store.load;
export const saveSettings = store.save;
export const currentTheme = () => gdpCurrentTheme(store);
export const applyTheme = () => gdpApplyTheme(store);
export const setupThemeButton = (button, onChange) => gdpSetupThemeButton(store, button, onChange);
