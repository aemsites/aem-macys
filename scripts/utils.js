import { toCamelCase, fetchPlaceholders } from './aem.js';

export const PRODUCTION_DOMAINS = ['www.macys.com'];

const domainCheckCache = {};
/**
 * Checks a url to determine if it is a known domain.
 * @param {string | URL} url the url to check
 * @returns {Object} an object with properties indicating the urls domain types.
 */
export function checkDomain(url) {
  const urlToCheck = typeof url === 'string' ? new URL(url) : url;

  let result = domainCheckCache[urlToCheck.hostname];
  if (!result) {
    const isProd = PRODUCTION_DOMAINS.some((host) => urlToCheck.hostname.includes(host));
    const isHlx = ['hlx.page', 'hlx.live', 'aem.page', 'aem.live'].some((host) => urlToCheck.hostname.includes(host));
    const isLocal = urlToCheck.hostname.includes('localhost');
    const isPreview = isLocal || urlToCheck.hostname.includes('hlx.page') || urlToCheck.hostname.includes('aem.page');
    const isKnown = isProd || isHlx || isLocal;
    const isExternal = !isKnown;
    result = {
      isProd,
      isHlx,
      isLocal,
      isKnown,
      isExternal,
      isPreview,
    };

    domainCheckCache[urlToCheck.hostname] = result;
  }

  return result;
}

/**
 * @returns {Object} an object with properties indicating the urls domain types.
 */
export function checkBrowserDomain() {
  return checkDomain(window.location);
}

/**
 * Mofiies a link element to be relative if it is a local link.
 * @param {Element} a the anchor (link) element
 * @returns {Element} the modified anchor element
 */
export function rewriteLinkUrl(a) {
  const url = new URL(a.href);
  const domainCheck = checkDomain(url);
  // protect against maito: links or other weirdness
  const isHttp = url.protocol === 'https:' || url.protocol === 'http:';
  if (!isHttp) return a;

  const ignoredPaths = [''];
  if (domainCheck.isKnown && !ignoredPaths.some((p) => url.pathname.startsWith(p))) {
    // local links are rewritten to be relative
    a.href = `${url.pathname}${url.search}${url.hash}`;
  } else if (domainCheck.isExternal) {
    // non local open in a new tab
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }

  return a;
}

/**
 * check if link text is same as the href
 * @param {Element} link the link element
 * @returns {boolean} true or false
 */
export function linkTextIncludesHref(link) {
  const href = link.getAttribute('href');
  const textcontent = link.textContent;

  return textcontent.includes(href);
}

/**
 * Wraps images followed by links within a matching <a> tag.
 * @param {Element} container The container element
 */
export function wrapImgsInLinks(container) {
  const pictures = container.querySelectorAll('picture');
  pictures.forEach((pic) => {
    // need to deal with 2 use cases here
    // CASE ONE: <picture><br/><a>
    if (pic.nextElementSibling && pic.nextElementSibling.tagName === 'BR'
      && pic.nextElementSibling.nextElementSibling && pic.nextElementSibling.nextElementSibling.tagName === 'A') {
      const link = pic.nextElementSibling.nextElementSibling;
      if (linkTextIncludesHref(link)) {
        pic.nextElementSibling.remove();
        link.innerHTML = pic.outerHTML;
        pic.replaceWith(link);
        return;
      }
    }
    // END CASE ONE

    // CASE TWO: <p><picture></p><p><a></p>
    const parent = pic.parentNode;
    if (!parent.nextElementSibling) {
      return;
    }
    const nextSibling = parent.nextElementSibling;
    if (parent.tagName !== 'P' || nextSibling.tagName !== 'P' || nextSibling.children.length > 1) {
      return;
    }
    const link = nextSibling.querySelector('a');
    if (link && linkTextIncludesHref(link)) {
      link.parentElement.remove();
      link.innerHTML = pic.outerHTML;
      pic.replaceWith(link);
    }
    // END CASE TWO
  });
}

/**
 * Returns the true origin of the current page in the browser.
 * If the page is running in a iframe with srcdoc, the ancestor origin is returned.
 * @returns {String} The true origin
 */
export function getOrigin() {
  return window.location.href === 'about:srcdoc' ? window.parent.location.origin : window.location.origin;
}


export function getConfig(prefix = '', segment = '') {
  window.hlx.config = window.hlx.config || {};
  if (!window.hlx.config[segment]) {
    window.hlx.config[segment] = new Promise((resolve) => {
      fetch(`${prefix}/config.json${segment ? `?sheet=${segment}` : ''}`)
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          return {};
        })
        .then((json) => {
          const configs = {};
          json.data
            .filter((cfg) => cfg.Key)
            .forEach((cfg) => {
              configs[toCamelCase(cfg.Key)] = cfg.Value;
            });
          window.hlx.config[segment] = configs;
          resolve(window.hlx.config[segment]);
        })
        .catch(() => {
          // error loading config
          window.hlx.config[segment] = {};
          resolve(window.hlx.config[segment]);
        });
    });
  }
  return window.hlx.config[segment];
}

export function fetchLanguagePlaceholders() {
  return fetchPlaceholders(`/${document.documentElement.lang || 'en'}`);
}
