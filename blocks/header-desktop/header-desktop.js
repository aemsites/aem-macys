import { loadFragment } from '../fragment/fragment.js';
import {
  div, nav, p,
} from '../../scripts/dom-helpers.js';
import {
  decorateNavDrops, decorateSearch, toggleTabState,
} from '../header-mobile/header-mobile.js';
import { buildBlock, decorateBlock, loadBlock } from '../../scripts/aem.js';

function toggleDesktopSubMenu(navDrop, subMenu, forceExpanded = null) {
  if (subMenu.dataset.status === 'initialized') {
    subMenu.dataset.status = 'loading';
    subMenu.style.display = 'none';
    const fragmentLink = subMenu.querySelector('a');
    const parent = fragmentLink.parentNode;
    const fragment = buildBlock('fragment', [[fragmentLink.cloneNode(true)]]);
    if (parent.tagName === 'P') {
      parent.before(fragment);
      parent.remove();
    } else {
      fragmentLink.before(fragment);
      fragmentLink.remove();
    }
    decorateBlock(fragment);
    loadBlock(fragment).then(() => {
      subMenu.querySelectorAll('.fragment-wrapper .section > div > ul > li').forEach((li) => {
        const subList = li.querySelector('ul');
        if (!subList && li.querySelector('a')) {
          li.querySelector('a').classList.add('sale');
        }
      });
      subMenu.dataset.status = 'loaded';
      subMenu.style.display = null;
    });
  }

  const btn = navDrop.querySelector(`button[aria-controls="${subMenu.id}"]`);
  const expanded = forceExpanded !== null ? forceExpanded : btn.getAttribute('aria-expanded') === 'true';
  const header = navDrop.closest('.header-desktop');
  const curtain = header.querySelector('.nav-curtain');

  if (!expanded) {
    // if opening something, close other navs first
    header.querySelectorAll('.nav-drop.active').forEach((expandedNavDrop) => {
      const expandedMenu = expandedNavDrop.querySelector('.sub-menu');
      const expandedButton = expandedNavDrop.querySelector(`button[aria-controls="${expandedMenu.id}"]`);
      expandedButton.setAttribute('aria-expanded', false);
      expandedNavDrop.classList.remove('active');
      toggleTabState(expandedMenu, true);
    });
  }

  btn.setAttribute('aria-expanded', !expanded);
  if (expanded) {
    navDrop.classList.remove('active');
  } else {
    navDrop.classList.add('active');
  }

  if (!header.querySelector('.nav-drop.active')) {
    curtain.classList.remove('show');
  } else {
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

function decorateNavSections(navSection) {
  if (!navSection) return;

  decorateHeaderNavDrops(navSection);
  navSection.querySelectorAll('.sub-menu').forEach((subMenu) => {
    if (subMenu.querySelector('a[href*="/nav-menus/"]')) {
      subMenu.dataset.status = 'initialized';
    }
  });

  const primaryList = navSection.querySelector('ul');
  primaryList.classList.add('primary-nav-list');
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

  // todo shop your store

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

  decorateSearch(navi.querySelector('.section.search'));
  decorateNavSections(navi.querySelector('.section.sections'));

  const closeMenu = () => {
    const openNavDrops = [...block.querySelectorAll('.nav-drop.active')];
    if (openNavDrops.length > 0) {
      const navDrop = openNavDrops.pop();
      toggleDesktopSubMenu(navDrop, navDrop.querySelector('.sub-menu'), true);
    }
  };

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') closeMenu();
  });
  navCurtain.addEventListener('click', closeMenu);
}
