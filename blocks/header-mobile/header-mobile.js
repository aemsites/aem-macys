import { loadFragment } from '../fragment/fragment.js';
import {
  div, nav, button, span, p, domEl, form,
} from '../../scripts/dom-helpers.js';
import { toClassName } from '../../scripts/aem.js';

function toggleTabState(menu, expanded) {
  menu.querySelectorAll('button, a').forEach((el) => {
    const inSubMenu = el.closest('.sub-menu');
    if (inSubMenu && inSubMenu !== menu) {
      return;
    }

    if (expanded) {
      el.setAttribute('tabindex', -1);
    } else {
      el.removeAttribute('tabindex');
    }
  });
}

function toggleSubMenu(navDrop, subMenu, forceExpanded = null) {
  const btn = navDrop.querySelector(`:scope > button[aria-controls="${subMenu.id}"]`);
  const closeBtn = subMenu.querySelector(`button[aria-controls="${subMenu.id}"]`);
  const expanded = forceExpanded || btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', !expanded);
  closeBtn.setAttribute('aria-expanded', !expanded);

  toggleTabState(subMenu, expanded);

  if (!expanded) {
    closeBtn.focus();
  } else {
    btn.focus();
  }
}

function toggleMenu(headerEl, forceExpanded = null) {
  const navEl = headerEl.querySelector('#mobile-nav');
  const btn = headerEl.querySelector('button[aria-controls="mobile-nav"]');
  const expanded = forceExpanded || btn.getAttribute('aria-expanded') === 'true';
  if (expanded) {
    navEl.classList.remove('expanded');
    // close all subMenus
    navEl.querySelectorAll('.sub-menu .toggle-closed[aria-expanded="true"]').forEach((closeToggle) => {
      toggleSubMenu(closeToggle.closest('.nav-drop'), closeToggle.closest('.sub-menu'), true);
    });
  } else {
    navEl.classList.add('expanded');
  }

  btn.setAttribute('aria-expanded', !expanded);
  btn.setAttribute('aria-label', `${expanded ? 'Open' : 'Close'} Navigation`);
  toggleTabState(navEl, expanded);
  document.body.style.overflowY = expanded ? '' : 'hidden';
}

function decorateNavDrops(sectionEl, recurse = true, idPrefix = 'menu-toggle') {
  if (!sectionEl) return;

  const ul = sectionEl.querySelector('ul');
  ul.querySelectorAll(':scope > li').forEach((li, idx) => {
    const subList = li.querySelector(':scope > ul');
    if (subList) {
      li.classList.add('nav-drop');
      const subMenu = div({ class: 'sub-menu' }, div({ class: 'mobile-nav-inner' }, subList));

      const buttonText = li.textContent.trim();
      const menuId = toClassName(`${idPrefix}-${buttonText}-${idx}`);
      subMenu.id = menuId;
      const btn = button({
        class: 'menu-toggler',
        type: 'button',
        'aria-controls': menuId,
        'aria-expanded': 'false',
      }, buttonText);

      if (buttonText.toLowerCase().includes('sale')) {
        btn.classList.add('sale');
      }

      const closeBtn = btn.cloneNode(true);
      closeBtn.classList.add('toggle-closed');
      if (li.querySelector('.icon')) {
        btn.prepend(li.querySelector('.icon'));
      }
      li.textContent = '';
      subMenu.querySelector('.mobile-nav-inner').prepend(closeBtn);

      btn.addEventListener('click', () => {
        toggleSubMenu(li, subMenu);
      });

      closeBtn.addEventListener('click', () => {
        toggleSubMenu(li, subMenu);
      });
      li.append(btn, subMenu);

      if (recurse) {
        decorateNavDrops(subMenu, recurse, `${idPrefix}-${buttonText}`);
      }
      toggleSubMenu(li, subMenu, true);
    } else {
      const a = li.querySelector('a');
      if (a && a.textContent.trim().toLowerCase().includes('sale')) {
        a.classList.add('sale');
      }
    }
  });
}

function decorateUserNav(userSection) {
  if (!userSection) return;

  decorateNavDrops(userSection, false, 'user-menu-toggle');
  const storeIcon = userSection.querySelector('.icon-store');
  if (storeIcon) {
    // todo
    // const parentLi = storeIcon.parentElement;
  }
}

function decorateUtilityNav(utilitySection) {
  if (!utilitySection) return;

  decorateNavDrops(utilitySection, false, 'utility-menu-toggle');

  utilitySection.querySelectorAll('.sub-menu .mobile-nav-inner > ul > li').forEach((li) => {
    const subList = li.querySelector(':scope > ul');
    if (subList) {
      const el = div({ class: 'util-sub-menu' }, subList);
      if (li.textContent.trim()) {
        const par = p(li.textContent);
        el.prepend(par);
      }
      li.parentElement.before(el);
    }
  });
}

function decorateBrand(brandSection) {
  if (!brandSection) return;

  const btnCont = brandSection.querySelector('.button-container');
  const btn = btnCont.querySelector('.button');
  btnCont.before(btn);
  btnCont.remove();
  btn.classList.remove('button');
}

function decorateSearch(searchSection) {
  if (!searchSection) return;

  const icon = searchSection.querySelector('.icon');
  searchSection.replaceChildren(form(
    {
      class: 'search-input-container',
      action: 'https://www.macys.com/shop/search',
    },
    icon,
    domEl('input', {
      class: 'search-input',
      'aria-description': 'search',
      placeholder: 'Search',
      name: 'keyword',
      type: 'text',
    }),
  ));
}

function decorateTools(toolsSection) {
  if (!toolsSection) return;

  toolsSection.querySelectorAll('a').forEach((a) => {
    const hasIcon = a.querySelector('.icon');
    if (!hasIcon) {
      a.classList.add('button');
    }
  });
}

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
  const navi = nav({ id: 'mobile-nav', class: 'mobile-nav' }, div({ class: 'mobile-nav-inner' }), button({ class: 'mobile-nav-close', 'aria-label': 'Close Navigation', type: 'button' }));
  const navCurtain = div({ class: 'nav-curtain' });
  headerMain.append(upper, navi, navCurtain);

  ['brand', 'tools', 'search'].forEach((sectionName) => {
    const section = headerMain.querySelector(`.section.${sectionName}`);
    if (section) {
      upper.append(section);
    }
  });
  const hamburger = div(
    { class: 'nav-hamburger' },
    button({
      type: 'button',
      'aria-controls': 'mobile-nav',
      'aria-label': 'Open Navigation',
      'aria-expanded': 'false',
    }, span({ class: 'nav-hamburger-icon' })),
  );
  upper.prepend(hamburger);
  hamburger.addEventListener('click', () => {
    toggleMenu(headerMain);
  });
  navi.querySelector('.mobile-nav-close').addEventListener('click', () => {
    toggleMenu(headerMain, true);
  });
  navCurtain.addEventListener('click', () => {
    toggleMenu(headerMain, true);
  });

  decorateBrand(upper.querySelector('.section.brand'));
  decorateTools(upper.querySelector('.section.tools'));
  decorateSearch(upper.querySelector('.section.search'));

  ['user', 'sections', 'utility'].forEach((sectionName) => {
    const section = headerMain.querySelector(`.section.${sectionName}`);
    if (section) {
      navi.querySelector('.mobile-nav-inner').append(section);
    }
  });

  decorateNavDrops(navi.querySelector('.section.sections'));
  decorateUserNav(navi.querySelector('.section.user'));
  decorateUtilityNav(navi.querySelector('.section.utility'));

  toggleMenu(headerMain, true);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      const openSubMenus = [...navi.querySelectorAll('.sub-menu .toggle-closed[aria-expanded="true"]')];
      if (openSubMenus.length > 0) {
        const closeToggle = openSubMenus.pop();
        toggleSubMenu(closeToggle.closest('.nav-drop'), closeToggle.closest('.sub-menu'), true);
      } else {
        toggleMenu(headerMain, true);
      }
    }
  });
  block.replaceChildren(headerMain);
}
