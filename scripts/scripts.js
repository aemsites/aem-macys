import {
  sampleRUM,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS,
  buildBlock,
  decorateBlock,
  loadScript,
  toClassName,
  getMetadata,
} from './aem.js';
import { wrapImgsInLinks } from './utils.js';

const LCP_BLOCKS = []; // add your LCP blocks to the list

const ICONS_CACHE = {};

/**
 * Attempt to replace <img> with <svg><use> to allow styling based on use of current color
 * @param {icon} icon <img> element
 */
async function spriteIcon(icon) {
  // init the sprite
  let svgSprite;
  if (icon.getRootNode() instanceof ShadowRoot) {
    svgSprite = icon.getRootNode().querySelector('#franklin-svg-sprite');
  } else {
    svgSprite = document.getElementById('franklin-svg-sprite');
  }
  if (!svgSprite) {
    const div = document.createElement('div');
    div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" id="franklin-svg-sprite" style="display: none"></svg>';
    svgSprite = div.firstElementChild;
    if (icon.getRootNode() instanceof ShadowRoot) {
      icon.getRootNode().append(svgSprite);
    } else {
      document.body.append(svgSprite);
    }
  }

  const { iconName } = icon.dataset;
  if (ICONS_CACHE[iconName]) {
    icon.alt = ICONS_CACHE[iconName];
  } else if (!svgSprite.querySelector(`#icons-sprite-${iconName}`)) {
    try {
      const response = await fetch(icon.src);
      if (!response.ok) {
        return;
      }

      const svg = await response.text();
      const parser = new DOMParser();
      const svgDOM = parser.parseFromString(svg, 'image/svg+xml');
      const svgElem = svgDOM.querySelector('svg');

      // only sprite icons that use currentColor
      if (svg.toLowerCase().includes('currentcolor')) {
        const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
        symbol.id = `icons-sprite-${iconName}`;
        symbol.setAttribute('viewBox', svgElem.getAttribute('viewBox'));
        while (svgElem.firstElementChild) {
          symbol.append(svgElem.firstElementChild);
        }
        svgSprite.append(symbol);
      } else {
        const title = svgElem.querySelector('title') ? svgElem.querySelector('title').textContent : iconName;
        icon.alt = title;
        ICONS_CACHE[iconName] = title;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  if (svgSprite.querySelector(`#icons-sprite-${iconName}`)) {
    const span = icon.closest('span.icon');
    if (span) span.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg"><use href="#icons-sprite-${iconName}"/></svg>`;
  }
}

/**
 * Add intersection observer to all icons in an element, to sprite them if possible
 * @param {Element} element element that contains icons
 * @param {string} [prefix] prefix for icon names
 */
export function spriteIcons(element) {
  const icons = [...element.querySelectorAll('span.icon')];
  icons.forEach((span) => {
    const img = span.querySelector('img');
    if (!img) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          spriteIcon(img);
          observer.disconnect();
        }
      });
    });
    observer.observe(img);
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * fetch an external url, bypass cors if needed.
 * @param {String} url the url to fetch
 * @returns the fetch response
 */
export async function fetchCors(url) {
  if (window.location.hostname.includes('macys.com')) {
    return fetch(url);
  }
  const worker = 'https://little-forest-58aa.david8603.workers.dev';
  const fetchUrl = `${worker}/?url=${encodeURIComponent(url)}`;
  return fetch(fetchUrl);
}
/**
 * Load a template module for the page
 * @param {Document} doc the document element
 */
async function loadTemplate(doc) {
  const template = toClassName(getMetadata('template'));
  if (template) {
    try {
      let templateMod;
      const cssLoaded = new Promise((resolve) => {
        try {
          loadCSS(`${window.hlx.codeBasePath}/templates/${template}/${template}.css`);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(`failed to load styles for ${template}`, error);
        }
        resolve();
      });
      const jsLoaded = new Promise((resolve) => {
        (async () => {
          try {
            templateMod = await import(`../templates/${template}/${template}.js`);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.log(`failed to load module for ${template}`, error);
          }
          resolve();
        })();
      });
      await Promise.all([cssLoaded, jsLoaded]);
      if (templateMod && templateMod.default) {
        await templateMod.default(doc);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Template Loading failed.', err);
    }
  }
}

function buildFragmentBlocks(container) {
  container.querySelectorAll('a[href*="/fragments/"]:only-child').forEach((a) => {
    const parent = a.parentNode;
    const fragment = buildBlock('fragment', [[a.cloneNode(true)]]);
    if (parent.tagName === 'P') {
      parent.before(fragment);
      parent.remove();
    } else {
      a.before(fragment);
      a.remove();
    }
    decorateBlock(fragment);
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildFragmentBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

function mergeButtonContainers(main) {
  let moreContainers = true;
  while (moreContainers) {
    const containerToMerge = main.querySelector('.button-container + .button-container');
    if (containerToMerge) {
      const mergeTo = containerToMerge.previousElementSibling;
      mergeTo.append(...containerToMerge.children);
      containerToMerge.remove();
    } else {
      moreContainers = false;
    }
  }
}

function trimAllWhitespace(text) {
  return text ? text.replace(/\s/g, ' ').trim() : '';
}

function decorateLinks(element) {
  element.querySelectorAll('a').forEach((a) => {
    a.title = trimAllWhitespace(a.title || a.textContent);
    if (!a.title || trimAllWhitespace(a.title).length === 0) {
      a.removeAttribute('title');
      if (a.querySelector('.icon [data-icon-name]')) {
        const { iconName } = a.querySelector('.icon [data-icon-name]').dataset;
        a.title = iconName;
      }
    }
  });
}

export function removeButtons(container) {
  container.querySelectorAll('.button-container').forEach((btnCon) => {
    btnCon.classList.remove('button-container');
    btnCon.querySelectorAll('.button').forEach((btn) => {
      btn.classList.remove('button');
    });
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateSections(main);
  buildAutoBlocks(main);
  decorateBlocks(main);
  decorateIcons(main);
  decorateLinks(main);
  wrapImgsInLinks(main);
  decorateButtons(main);
  mergeButtonContainers(main);
  spriteIcons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  await loadTemplate(doc);
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

async function loadHeader(header) {
  await loadScript('/blocks/header/aem-header.js', {
    type: 'module',
  });
  const webComponent = document.createElement('aem-header');
  // webComponent.setAttribute('origin', 'https://main--aem-macys--aemsites.aem.live');
  header.append(webComponent);
}

async function loadFooter(footer) {
  await loadScript('/blocks/footer/aem-footer.js', {
    type: 'module',
  });
  const webComponent = document.createElement('aem-footer');
  // webComponent.setAttribute('origin', 'https://main--aem-macys--aemsites.aem.live');
  footer.append(webComponent);
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  if (window.hlx && window.hlx.skipInit) return;

  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
