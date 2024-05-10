import { loadFragment } from '../fragment/fragment.js';
import {
  div, nav, button, span, domEl
} from '../../scripts/dom-helpers.js';

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
  const navi = nav({ id: 'mobile-nav', class: 'mobile-nav' });
  headerMain.append(upper, navi);

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
    }, span({ class: 'nav-hamburger-icon' })),
  );
  upper.prepend(hamburger);
  decorateBrand(upper.querySelector('.section.brand'));
  decorateTools(upper.querySelector('.section.tools'));
  decorateSearch(upper.querySelector('.section.search'));

  ['user', 'sections', 'utility'].forEach((sectionName) => {
    const section = headerMain.querySelector(`.section.${sectionName}`);
    if (section) {
      navi.append(section);
    }
  });

  block.replaceChildren(headerMain);
}
