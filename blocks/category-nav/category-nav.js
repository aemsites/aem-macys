import { getMetadata, toClassName } from '../../scripts/aem.js';
import { button } from '../../scripts/dom-helpers.js';

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

/**
 * decorate the cateogyr nav block
 * @param {Element} block the block
 */
export default async function decorate(block) {
  const catId = getMetadata('category-id');
  if (catId) {
    // const pathname = encodeURIComponent(`${window.location.pathname}&id=${catId}`);
    // encoding this fails, for...reasons !!!!?!?!?!
    const pathname = `${window.location.pathname}&id=${catId}`;
    const fetchUrl = `https://www.macys.com/xapi/discover/v1/page?pathname=${pathname}&_application=SITE&_navigationType=BROWSE&_deviceType=DESKTOP&_shoppingMode=SITE&_regionCode=US&_customerExperiment=1086-21,1162-21,1167-21,1180-21,2026-21,2027-11,2030-11,662-23,664-33,835-21&currencyCode=USD&_customerState=GUEST&pageIndex=2&productsPerPage=60&sortBy=ORIGINAL&_additionalStoreLocations=5111&spItemsVersion=1.0&customerId=08ac3e2c-a913-47f6-b9f6-8193d7deb43e&utagId=018f64b4903c000fc4c48868899e05075002406d00fb8&visitorId=23920667182692754085265786200524946032&size=medium`;
    const resp = await fetch(fetchUrl);
    if (resp.ok) {
      const json = await resp.json();
      if (json.body && json.body.categoryTree && json.body.categoryTree.groups) {
        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', 'Category Navigation');
        const navList = renderNavList(json.body.categoryTree.groups);
        nav.append(navList);
        nav.id = 'category-nav';
        block.replaceChildren(nav);

        const expandButton = button({
          type: 'button',
          class: 'toggle-nav',
          'aria-controls': 'category-nav',
          'aria-label': 'Category Navigation',
        });
        toggleNav(expandButton, nav, isDesktop.matches);
        isDesktop.addEventListener('change', () => {
          toggleNav(expandButton, nav, isDesktop.matches);
        });
        expandButton.addEventListener('click', () => {
          toggleNav(expandButton, nav);
        });
        block.prepend(expandButton);
      }
    }
  }
}
