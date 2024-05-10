import { loadFragment } from '../fragment/fragment.js';
import { div, nav, domEl } from '../../scripts/dom-helpers.js';
/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  block.classList.add('shared-header');
  const a = block.querySelector('a');
  const fragmentPath = a ? new URL(a.href, window.location).href : '/nav-mobile';
  const fragment = await loadFragment(fragmentPath);

  const headerMain = div({ class: 'header-main' });
  while (fragment.firstElementChild) headerMain.append(fragment.firstElementChild);

  const upper = div({ class: 'header-upper' });
  const navi = nav({ id: 'mobile-nav', class: 'mobile-nav' });
  headerMain.append(upper, navi);

  ['brand', 'tools', 'search'].forEach((sectionName) => {
    const section = headerMain.querySelector(`.section.${sectionName}`);
    if (section) {
      upper.append(section);
    }
  });
  const hamburger = div();
  upper.prepend(hamburger);

  ['user', 'sections', 'utility'].forEach((sectionName) => {
    const section = headerMain.querySelector(`.section.${sectionName}`);
    if (section) {
      navi.append(section);
    }
  });

  block.replaceChildren(headerMain);
}
