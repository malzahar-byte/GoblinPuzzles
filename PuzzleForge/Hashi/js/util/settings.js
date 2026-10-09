// Hashi's own settings: wraps the shared Goblin Does Puzzles settings store. Made from
// shared/puzzle-template/settings.js.
import { createSettingsStore, currentTheme as gdpCurrentTheme, applyTheme as gdpApplyTheme, setupThemeButton as gdpSetupThemeButton } from '../../../../shared/gdp-settings.js?v=13.0.14logic';

const KEY = 'gdp-hashi-settings';
export const SETTINGS_KEY = KEY; // the ONLY place this string is allowed to be written
export const PROGRESS_PREFIX = 'gdp-hashi:'; // every saved-progress key starts with this

const DEFAULTS = { theme: null, board: 'panel', grid: true, boardStyle: 'classic', showTimer: true };
const store = createSettingsStore(KEY, DEFAULTS);

export const loadSettings = store.load;
export const saveSettings = store.save;
export const currentTheme = () => gdpCurrentTheme(store);
export const applyTheme = () => gdpApplyTheme(store);
export const setupThemeButton = (button, onChange) => gdpSetupThemeButton(store, button, onChange);
