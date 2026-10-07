// TEMPLATE — copy this file to <your-puzzle>/js/util/settings.js and replace the three
// <PUZZLE> markers below. Do not change anything else; do not add more exports here that
// aren't theme/settings related — puzzle-specific state (grid, progress) belongs in your own
// code, not this file.
//
// THE RULE THIS FILE EXISTS TO ENFORCE: your settings key is a string literal exactly ONCE,
// right here. Every other file — including your HTML pages' pre-paint snippet — imports
// SETTINGS_KEY from here instead of typing the string again. `dev-tools/check-integration.mjs`
// scans the whole repo for that string appearing in more than one file and will fail if you
// break this.
import { createSettingsStore, currentTheme as gdpCurrentTheme, applyTheme as gdpApplyTheme, setupThemeButton as gdpSetupThemeButton } from '../../../shared/gdp-settings.js';

const KEY = 'gdp-<PUZZLE>-settings';
export const SETTINGS_KEY = KEY; // the ONLY place this string is allowed to be written

// If your puzzle saves progress (grid state, timers, etc.) separately from settings, prefix
// every progress key with this so a "clear my progress" action can never touch another
// puzzle's data. Delete this export if your puzzle has no saved progress to clear.
export const PROGRESS_PREFIX = 'gdp-<PUZZLE>:';

// Your puzzle's own setting fields and their defaults. `theme` is required (null = follow the
// device); add whatever else your puzzle's settings panel needs.
const DEFAULTS = { theme: null };

const store = createSettingsStore(KEY, DEFAULTS);

export const loadSettings = store.load;
export const saveSettings = store.save;
export const currentTheme = () => gdpCurrentTheme(store);
export const applyTheme = () => gdpApplyTheme(store);
export const setupThemeButton = (button, onChange) => gdpSetupThemeButton(store, button, onChange);
