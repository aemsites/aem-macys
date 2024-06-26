import { getMetadata, toClassName } from '../../scripts/aem.js';
import { button } from '../../scripts/dom-helpers.js';
import invokePageApi from '../../scripts/macys-api.js';

const isDesktop = window.matchMedia('(width >= 900px)');

function toggleTabability(container, visible) {
  container.querySelectorAll('button, a').forEach((el) => {
    if (visible) {
      el.removeAttribute('tabindex');
    } else {
      el.setAttribute('tabindex', -1);
    }
  });
}

function toggleNav(toggleButton, nav, forceExpanded = null) {
  const shouldExpand = forceExpanded !== null ? forceExpanded : toggleButton.getAttribute('aria-expanded') === 'false';
  toggleButton.setAttribute('aria-expanded', shouldExpand);
  toggleTabability(nav, shouldExpand);
  nav.querySelectorAll('.nav-expandable').forEach((expandable, idx) => {
    const btn = expandable.querySelector(':scope > button');
    const controls = expandable.querySelector(`#${btn.getAttribute('aria-controls')}`);
    const expandSub = forceExpanded && idx === 0;
    btn.setAttribute('aria-expanded', expandSub);
    toggleTabability(controls, expandSub);
  });
}

function renderNavList(navData) {
  const ul = document.createElement('ul');

  navData.forEach((navItem, idx) => {
    const li = document.createElement('li');

    const createNavLink = (item) => {
      const span = document.createElement('span');
      span.classList.add('nav-header');
      if (item.style) {
        span.classList.add(item.style);
      }
      span.textContent = item.text;
      if (item.url) {
        const a = document.createElement('a');
        a.href = item.url;
        a.append(span);

        if (item.style) {
          a.classList.add(item.style);
        }

        return a;
      }

      return span;
    };

    if (navItem.header) {
      li.append(createNavLink(navItem.header));
    } else {
      li.append(createNavLink(navItem));
    }
    ul.append(li);

    if (navItem.children) {
      const childrenList = renderNavList(navItem.children);
      const header = li.querySelector('.nav-header');
      const id = toClassName(`category-nav-header-${header.textContent}- ${idx}`);
      childrenList.id = id;
      const btn = button({
        'aria-controls': id,
        type: 'button',
        'aria-expanded': 'false',
      });
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !expanded);
        toggleTabability(childrenList, !expanded);
      });
      toggleTabability(childrenList, false);
      header.before(btn);
      btn.append(header);
      li.classList.add('nav-expandable');
      const expansionInner = document.createElement('div');
      expansionInner.className = 'nav-expansion-inner';
      expansionInner.append(childrenList);
      li.append(expansionInner);
    }
  });

  return ul;
}

async function loadNav(catId, nav) {
  const resp = await invokePageApi(window.location.pathname, catId);
  if (resp.ok) {
    const json = await resp.json();
    if (json.body && json.body.categoryTree && json.body.categoryTree.groups) {
      const navList = renderNavList(json.body.categoryTree.groups);
      nav.append(navList);
      nav.id = 'category-nav';
    }
  }
}

/**
 * decorate the category nav block
 * @param {Element} block the block
 */
export default async function decorate(block) {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Category Navigation');

  const expandButton = button({
    type: 'button',
    class: 'toggle-nav',
    'aria-controls': 'category-nav',
    'aria-label': 'Category Navigation',
  });

  isDesktop.addEventListener('change', () => {
    toggleNav(expandButton, nav, isDesktop.matches);
  });
  expandButton.addEventListener('click', () => {
    toggleNav(expandButton, nav);
  });
  block.replaceChildren(expandButton, nav);

  const catId = getMetadata('category-id');
  if (catId) {
    loadNav(catId, nav).then(() => {
      toggleNav(expandButton, nav, isDesktop.matches);
    });
  }
}
