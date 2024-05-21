// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './aem.js';

/**
 * a helper to flush fragment plain html from browser cache so when authors edit them
 * they get flushed so when they subsequently view referencing pages
 * they see the right result
 */
async function flushFragmentCache() {
  const isFragment = ['/fragments/', '/nav-menus/', '/footer', '/nav-mobile', '/nav-desktop']
    .some((fragmentPath) => window.location.pathname.includes(fragmentPath));
  if (isFragment) {
    fetch(`${window.location.pathname}.plain.html`, { cache: 'reload' });
  }
}

async function runDelayed() {
  // Core Web Vitals RUM collection
  sampleRUM('cwv');

  // add more delayed functionality here
  flushFragmentCache();
}

runDelayed();
