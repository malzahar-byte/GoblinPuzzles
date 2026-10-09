// Goblin Does Puzzles — "load latest version" helper + visible build label.
//
// GitHub Pages and browsers cache JavaScript modules and CSS aggressively, so a deploy can take
// minutes to appear even after Ctrl+Shift+R. This helper clears anything the app itself owns
// (Cache API entries named gdp-*, and any service worker) and then reloads the page with a unique
// query so the browser must re-fetch the document.
//
// The real durability comes from versioned asset URLs: bump GDP_BUILD each release and every
// first-party <link>, <script> and local import carries "?v=GDP_BUILD", so a new build is a new
// URL no cache has. No button can purge a CDN's own copy — if a deploy is seconds old, waiting
// ~10 minutes (GitHub Pages' cache TTL) is the fallback.
export const GDP_BUILD = '13.0.19logic';

export async function clearAppCaches() {
  try {
    if (typeof caches === 'undefined') return;
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.indexOf('gdp-') === 0).map(n => caches.delete(n)));
  } catch (e) { /* caches unavailable: ignore */ }
}
export async function unregisterServiceWorkers() {
  try {
    if (!('serviceWorker' in navigator)) return;
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
  } catch (e) { /* ignore */ }
}
export async function loadLatestVersion() {
  await clearAppCaches();
  await unregisterServiceWorkers();
  const url = new URL(window.location.href);
  url.searchParams.set('_gdp', Date.now().toString(36));
  window.location.replace(url.toString());
}
export function showBuildVersion(el) {
  const target = el || document.getElementById('buildTag');
  if (target) target.textContent = 'v' + GDP_BUILD;
}
export function setupFreshButton(button, versionEl) {
  if (button) button.addEventListener('click', (e) => { e.preventDefault(); loadLatestVersion(); });
  showBuildVersion(versionEl);
}
