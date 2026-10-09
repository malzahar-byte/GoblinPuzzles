// Akari's own settings: wraps the shared settings store. Made from shared/puzzle-template/settings.js.
import { createSettingsStore, currentTheme as gdpCurrentTheme, applyTheme as gdpApplyTheme, setupThemeButton as gdpSetupThemeButton } from '../../../../shared/gdp-settings.js?v=13.0.1logic';

const KEY = 'gdp-akari-settings';
export const SETTINGS_KEY = KEY;
export const PROGRESS_PREFIX = 'gdp-akari:';

const DEFAULTS = { theme: null, surface: true, grid: true, showTimer: true, boardStyle: 'classic' };
const store = createSettingsStore(KEY, DEFAULTS);

export const loadSettings = store.load;
export const saveSettings = store.save;
export const currentTheme = () => gdpCurrentTheme(store);
export const applyTheme = () => gdpApplyTheme(store);
export const setupThemeButton = (button, onChange) => gdpSetupThemeButton(store, button, onChange);
