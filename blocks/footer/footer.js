import { getMetadata, toClassName } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import {
  button, div, ul, li,
} from '../../scripts/dom-helpers.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

const toggleNavSection = (navDrop, expanded) => {
  const navControlButton = navDrop.querySelector(':scope > button');
  const subList = navDrop.querySelector(':scope > ul');
  navControlButton.setAttribute('aria-expanded', expanded);
  subList.querySelectorAll('li > a').forEach((navLink) => {
    if (!expanded) {
      navLink.setAttribute('tabindex', -1);
    } else {
      navLink.removeAttribute('tabindex');
    }
  });
};

const toggleAllNavSections = (navUl, expanded = false) => {
  navUl.querySelectorAll('li.nav-drop').forEach((navSection) => {
    toggleNavSection(navSection, expanded);
  });
};

function toggleNavButtonAbility(navList, buttonsDisabled) {
  navList.querySelectorAll('.nav-drop > button').forEach((btn) => {
    if (buttonsDisabled) {
      btn.setAttribute('disabled', '');
    } else {
      btn.removeAttribute('disabled');
    }
  });
}

function decorateNav(navSection) {
  if (!navSection || !navSection.querySelector('ul')) return;

  const navList = navSection.querySelector('ul');
  navList.classList.add('nav-list');
  navList.querySelectorAll(':scope > li').forEach((liEl, idx) => {
    const subList = liEl.querySelector(':scope > ul');
    if (subList) {
      liEl.classList.add('nav-drop');
      const textNodes = [...liEl.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE);
      const liText = textNodes.map((text) => text.textContent).join('').trim();
      const dropButton = button({ type: 'button', 'aria-expanded': false, 'aria-controls': `drop-${toClassName(liText)}-${idx}` }, liText);
      liEl.prepend(dropButton);
      textNodes.forEach((text) => text.remove());
      liEl.classList.add('nav-drop');
      subList.setAttribute('id', `drop-${toClassName(liText)}-${idx}`);
      dropButton.addEventListener('click', () => {
        if (!isDesktop.matches) {
          const expanded = dropButton.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navList);
          toggleNavSection(liEl, !expanded);
        }
      });
    }
  });

  isDesktop.addEventListener('change', () => {
    toggleAllNavSections(navList, isDesktop.matches);
    toggleNavButtonAbility(navList, isDesktop.matches);
  });
  toggleAllNavSections(navList, isDesktop.matches);
  toggleNavButtonAbility(navList, isDesktop.matches);
}

function decorateApps(appsSection) {
  if (!appsSection) return;

  const listEl = ul();
  appsSection.querySelectorAll('a').forEach((a, idx) => {
    const listItem = li();
    const p = a.closest('p');
    listItem.append(a);
    listEl.append(listItem);

    if (p) {
      if (idx === 0) p.before(listEl);
      if (p.children.length === 0) p.remove();
    }
  });
}

function decorateCard(cardSection) {
  if (!cardSection) return;

  const colOne = div();
  const colTwo = div();
  const cardCols = div({ class: 'card-columns' }, colOne, colTwo);

  let afterCardPicture = false;
  cardSection.querySelectorAll('p').forEach((p) => {
    if (afterCardPicture && !p.querySelector('.button')) {
      colTwo.append(p);
    }

    if (p.querySelector('picture')) {
      p.before(cardCols);
      colOne.append(p);
      afterCardPicture = true;
    }
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  const footerMain = div({ class: 'footer-main' });
  while (fragment.firstElementChild) footerMain.append(fragment.firstElementChild);

  decorateNav(footerMain.querySelector('.nav'));
  decorateCard(footerMain.querySelector('.card'));
  decorateApps(footerMain.querySelector('.apps'));
  block.replaceChildren(footerMain);

  if (footerMain.querySelector('.legal')) {
    const footerLower = div();
    footerLower.append(footerMain.querySelector('.legal'));
    block.append(footerLower);
  }
}
