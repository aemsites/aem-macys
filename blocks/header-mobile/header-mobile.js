import { loadFragment } from '../fragment/fragment.js';
import {
  div, nav, button, span, domEl,
} from '../../scripts/dom-helpers.js';
import { toClassName } from '../../scripts/aem.js';

function decorateSections(sectionsSection) {
  sectionsSection.querySelectorAll('ul > li').forEach((li, idx) => {
    const subList = li.querySelector(':scope > ul');
    if (subList) {
      li.classList.add('nav-drop');
      const subMenu = div({ class: 'sub-menu' }, div({ class: 'mobile-nav-inner' }, subList));

      const buttonText = li.textContent.trim();
      const menuId = toClassName(`menu-toggle-${buttonText}-${idx}`);
      const btn = button({
        class: 'menu-toggler',
        type: 'button',
        'aria-controls': menuId,
        'aria-expanded': 'false',
      }, buttonText);
      if (buttonText.toLowerCase().includes('sale')) {
        btn.classList.add('sale');
      }
      li.textContent = '';
      const closeBtn = btn.cloneNode(true);
      closeBtn.classList.add('toggle-closed');
      subMenu.querySelector('.mobile-nav-inner').prepend(closeBtn);
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !expanded);
        closeBtn.setAttribute('aria-expanded', !expanded);
      });
      closeBtn.addEventListener('click', () => {
        const expanded = closeBtn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !expanded);
        closeBtn.setAttribute('aria-expanded', !expanded);
      });
      subMenu.id = menuId;

      li.append(btn, subMenu);
    } else {
      const a = li.querySelector('a');
      if (a && a.textContent.trim().toLowerCase().includes('sale')) {
        a.classList.add('sale');
      }
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
  searchSection.replaceChildren(div(
    { class: 'search-input-container' },
    icon,
    domEl('input', {
      class: 'search-input',
      'aria-description': 'search',
      placeholder: 'Search',
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
  const navi = nav({ id: 'mobile-nav', class: 'mobile-nav' }, div({ class: 'mobile-nav-inner' }));
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
    const btn = hamburger.querySelector('button');
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    navi.classList.toggle('expanded');
    btn.setAttribute('aria-expanded', !expanded);
    btn.setAttribute('aria-label', `${expanded ? 'Open' : 'Close'} Navigation`);
    document.body.style.overflowY = expanded ? '' : 'hidden';
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
  decorateSections(navi.querySelector('.section.sections'));

  block.replaceChildren(headerMain);
}
