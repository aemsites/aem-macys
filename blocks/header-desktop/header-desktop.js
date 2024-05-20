import { loadFragment } from '../fragment/fragment.js';
import {
  div, nav, p,
} from '../../scripts/dom-helpers.js';
import {
  decorateBrand, decorateNavDrops, decorateSearch, toggleTabState,
} from '../header-mobile/header-mobile.js';

function toggleDesktopSubMenu(navDrop, subMenu, forceExpanded = null) {
  const btn = navDrop.querySelector(`button[aria-controls="${subMenu.id}"]`);
  const expanded = forceExpanded !== null ? forceExpanded : btn.getAttribute('aria-expanded') === 'true';
  const header = navDrop.closest('.header-desktop');
  const curtain = header.querySelector('.nav-curtain');

  // close other navs first
  header.querySelectorAll('.sub-menu.expanded').forEach((expandedMenu) => {
    expandedMenu.classList.remove('expanded');
    const expandedNavDrop = expandedMenu.closest('.nav-drop');
    const expandedButton = expandedNavDrop.querySelector(`button[aria-controls="${expandedMenu.id}"]`);
    expandedButton.setAttribute('aria-expanded', false);
    toggleTabState(expandedMenu, true);
  });

  btn.setAttribute('aria-expanded', !expanded);
  if (expanded) {
    subMenu.classList.remove('expanded');
    curtain.classList.remove('show');
  } else {
    subMenu.classList.add('expanded');

    curtain.classList.add('show');
    if (navDrop.closest('.header-upper')) {
      curtain.classList.add('upper');
    } else {
      curtain.classList.remove('upper');
    }
  }

  toggleTabState(subMenu, expanded);
}

function decorateHeaderNavDrops(sectionEl, recurse = false, idPrefix = 'menu-toggle') {
  if (!sectionEl) return;

  decorateNavDrops(sectionEl, recurse, idPrefix, toggleDesktopSubMenu);

  sectionEl.querySelectorAll('.nav-drop').forEach((navDrop) => {
    navDrop.querySelector('.menu-toggler.toggle-closed').remove();
    const navLink = navDrop.querySelector('.menu-toggler a');
    if (navLink) {
      const toggler = navDrop.querySelector('.menu-toggler');
      const dropHeader = div({ class: 'nav-drop-header' });
      toggler.before(dropHeader);
      dropHeader.append(navLink, toggler);
      toggler.textContent = '';

      let overFired;
      navDrop.addEventListener('mouseover', () => {
        overFired = true;
        toggleDesktopSubMenu(navDrop, navDrop.querySelector('.sub-menu'), false);
      });
      navDrop.addEventListener('mouseout', () => {
        overFired = false;
        setTimeout(() => {
          if (!overFired) {
            toggleDesktopSubMenu(navDrop, navDrop.querySelector('.sub-menu'), true);
          }
        }, 500);
      });
    }
  });
}

function decorateUtilityNav(utilitySection) {
  if (!utilitySection) return;

  decorateHeaderNavDrops(utilitySection, false, 'utility-menu-toggle');

  utilitySection.querySelectorAll('.sub-menu .nav-menu-inner > ul > li').forEach((li) => {
    const subList = li.querySelector(':scope > ul');
    if (subList) {
      const el = div({ class: 'util-sub-menu' }, subList);
      if (li.textContent.trim()) {
        const par = p(li.textContent);
        el.prepend(par);
      }
      li.parentElement.before(el);
      li.remove();
    }
  });

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

  const navCurtain = div({ class: 'nav-curtain' });
  block.append(upper, navi, navCurtain);

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

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      const openSubMenus = [...block.querySelectorAll('.sub-menu.expanded')];
      if (openSubMenus.length > 0) {
        const subMenu = openSubMenus.pop();
        toggleDesktopSubMenu(subMenu.closest('.nav-drop'), subMenu, true);
      }
    }
  });
  navCurtain.addEventListener('click', () => {
    const openSubMenus = [...block.querySelectorAll('.sub-menu.expanded')];
    if (openSubMenus.length > 0) {
      const subMenu = openSubMenus.pop();
      toggleDesktopSubMenu(subMenu.closest('.nav-drop'), subMenu, true);
    }
  });
}
