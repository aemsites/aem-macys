import { loadFragment } from '../fragment/fragment.js';
import {
  div, nav,
} from '../../scripts/dom-helpers.js';
import { decorateBrand, decorateNavDrops, decorateSearch } from '../header-mobile/header-mobile.js';

function decorateHeaderNavDrops(sectionEl, recurse = true, idPrefix = 'menu-toggle') {
  if (!sectionEl) return;

  decorateNavDrops(sectionEl, recurse, idPrefix);

  sectionEl.querySelectorAll('.nav-drop').forEach((navDrop) => {
    navDrop.querySelector('.menu-toggler.toggle-closed').remove();
    const navLink = navDrop.querySelector('.menu-toggler a');
    if (navLink) {
      const toggler = navDrop.querySelector('.menu-toggler');
      const dropHeader = div({ class: 'nav-drop-header' });
      toggler.before(dropHeader);
      dropHeader.append(navLink, toggler);
      toggler.textContent = '';
    }
  });
}

function decorateUtilityNav(utilitySection) {
  if (!utilitySection) return;

  decorateHeaderNavDrops(utilitySection);

  const list = utilitySection.querySelector('ul');
  list.className = 'utility-nav-list';
  utilitySection.classList.add('nav');
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  block.classList.add('shared-header');
  const a = block.querySelector('a');
  const fragmentPath = a ? new URL(a.href, window.location).href : '/nav-desktop';
  const fragment = await loadFragment(fragmentPath);
  block.textContent = '';
  while (fragment.firstElementChild) block.append(fragment.firstElementChild);

  const upper = div({ class: 'header-upper' }, div({ class: 'header-width-container' }));
  const navi = nav(
    {
      id: 'desktop-nav',
      class: 'nav desktop-nav',
    },
    div({ class: 'header-width-container' }),
  );
  block.append(upper, navi);

  ['message', 'utility'].forEach((sectionName) => {
    const section = block.querySelector(`.section.${sectionName}`);
    if (section) {
      upper.querySelector('.header-width-container').append(section);
    }
  });
  decorateUtilityNav(upper.querySelector('.section.utility'));

  ['brand', 'search', 'tools', 'sections'].forEach((sectionName) => {
    const section = block.querySelector(`.section.${sectionName}`);
    if (section) {
      navi.querySelector('.header-width-container').append(section);
    }
  });
  decorateBrand(navi.querySelector('.section.brand'));
  decorateSearch(navi.querySelector('.section.search'));
  decorateHeaderNavDrops(navi.querySelector('.section.sections'));
}
