import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const a = block.querySelector('a');
  const fragmentPath = a ? new URL(a.href, window.location).href : '/nav-mobile';
  const fragment = await loadFragment(fragmentPath);
  block.textContent = '';
  while (fragment.firstElementChild) block.append(fragment.firstElementChild);
}
