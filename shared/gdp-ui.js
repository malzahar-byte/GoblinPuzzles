// Goblin Does Puzzles — small shared DOM/interaction helpers (behaviour, not data).

// Makes a Bootstrap offcanvas behave as a non-modal "slide-out panel" instead of a dialog.
export function setupNonModalPanel(panelEl, toggleBtn) {
  if (!panelEl || !toggleBtn || !window.bootstrap) return;
  document.addEventListener('click', (e) => {
    if (!panelEl.classList.contains('show')) return;
    if (panelEl.contains(e.target) || toggleBtn.contains(e.target)) return;
    window.bootstrap.Offcanvas.getOrCreateInstance(panelEl).hide();
  });
}

// Initializes Bootstrap tooltips on every [data-bs-toggle="tooltip"] element currently on the page.
export function setupTooltips() {
  if (!window.bootstrap) return;
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
    if (!window.bootstrap.Tooltip.getInstance(el)) new window.bootstrap.Tooltip(el);
  });
}

// Settings dock: one fixed element that holds BOTH the right-edge tab and the slide-out panel, so
// they move as a single unit (the tab stays attached to the drawer). No Bootstrap dependency —
// it works even when the CDN is blocked. Markup:
//
//   <div class="gdp-settings-dock" id="settingsDock">
//     <button class="gdp-settings-tab" aria-controls="settingsPanel" aria-expanded="false">Settings</button>
//     <div class="gdp-settings-panel" id="settingsPanel"> ...controls... </div>
//   </div>
//
// Returns { setOpen, toggle, isOpen }. Closes on Escape and on a click outside.
export function setupSettingsDock(dock) {
  if (!dock) return null;
  const tab = dock.querySelector('.gdp-settings-tab');
  const closeBtn = dock.querySelector('[data-gdp-settings-close]');
  let open = false;
  function setOpen(v) {
    open = !!v;
    dock.classList.toggle('is-open', open);
    if (tab) tab.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (tab) tab.addEventListener('click', () => setOpen(!open));
  if (closeBtn) closeBtn.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });
  document.addEventListener('click', (e) => { if (open && !dock.contains(e.target)) setOpen(false); });
  return { setOpen, toggle: () => setOpen(!open), isOpen: () => open };
}
