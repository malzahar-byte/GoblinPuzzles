// Nonogram's own settings: wraps the shared Goblin Does Puzzles settings store. Made from
// shared/puzzle-template/settings.js. Nonogram is a separate puzzle from Pictogram, so it gets
// its own settings key and progress prefix — progress cleared here can never touch Pictogram's
// (notes/interfaces/settings-progress.md).
import { createSettingsStore, currentTheme as gdpCurrentTheme, applyTheme as gdpApplyTheme, setupThemeButton as gdpSetupThemeButton } from '../../../../shared/gdp-settings.js';

const KEY = 'gdp-nonogram-settings';
export const SETTINGS_KEY = KEY; // the ONLY place this string is allowed to be written
export const PROGRESS_PREFIX = 'gdp-nonogram:'; // every saved-progress key starts with this

const DEFAULTS = { theme: null, board: 'classic', mark: 'x', showTimer: true };
const store = createSettingsStore(KEY, DEFAULTS);

export const loadSettings = store.load;
export const saveSettings = store.save;
export const currentTheme = () => gdpCurrentTheme(store);
export const applyTheme = () => gdpApplyTheme(store);
export const setupThemeButton = (button, onChange) => gdpSetupThemeButton(store, button, onChange);
