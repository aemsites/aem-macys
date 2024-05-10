import { buildBlock, decorateBlock } from '../../scripts/aem.js';

// eslint-disable-next-line import/prefer-default-export
export class AEMHeader extends HTMLElement {
  constructor() {
    super();

    // Attaches a shadow DOM tree to the element
    // With mode open the shadow root elements are accessible from JavaScript outside the root
    this.attachShadow({ mode: 'open' });

    // Keep track if we have rendered the fragment yet.
    this.initialized = false;
  }

  async loadBlock(name, wrapper) {
    const blockStyles = document.createElement('link');
    blockStyles.setAttribute('rel', 'stylesheet');
    blockStyles.setAttribute('href', `${origin}/blocks/header-${name}/header-${name}.css`);
    this.shadowRoot.appendChild(blockStyles);

    const a = document.createElement('a');
    a.href = `${origin}/nav-${name}`;
    a.textContent = a.href;
    const block = buildBlock(`header-${name}`, a);
    wrapper.append(block);
    decorateBlock(block);

    block.dataset.blockStatus = 'loading';
    try {
      const mod = await import(`../header-${name}/header-${name}.js`);
      if (mod.default) {
        await mod.default(block);

        const resetAttributeBase = (tag, attr) => {
          block.querySelectorAll(`${tag}[${attr}^="/"]`).forEach((elem) => {
            const newVal = new URL(elem.getAttribute(attr), origin).href;
            elem[attr] = newVal;
          });
        };
        resetAttributeBase('a', 'href');
        resetAttributeBase('img', 'src');
        resetAttributeBase('source', 'srcset');
      }
      block.dataset.blockStatus = 'loaded';
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err || 'An error occured while loading the header');
      block.dataset.blockStatus = 'error';
    }
  }

  async loadDesktopHeader(wrapper) {
    if (wrapper.dataset.loaded !== 'true') {
      await this.loadBlock('desktop', wrapper);

      wrapper.dataset.loaded = 'true';
    }
  }

  async loadMobileHeader(wrapper) {
    if (wrapper.dataset.loaded !== 'true') {
      await this.loadBlock('mobile', wrapper);

      wrapper.dataset.loaded = 'true';
    }
  }

  async loadHeaders(body, isDesktop) {
    const desktopWrapper = body.querySelector('.desktop-header-wrapper');
    const mobileWrapper = body.querySelector('.mobile-header-wrapper');
    if (isDesktop.matches) {
      mobileWrapper.setAttribute('aria-hidden', 'true');
      await this.loadDesktopHeader(desktopWrapper);
      desktopWrapper.setAttribute('aria-hidden', 'false');
    } else {
      desktopWrapper.setAttribute('aria-hidden', 'true');
      await this.loadMobileHeader(mobileWrapper);
      mobileWrapper.setAttribute('aria-hidden', 'false');
    }
  }

  /**
   * Invoked each time the custom element is appended into a document-connected element.
   * This will happen each time the node is moved, and may happen before the element's contents
   * have been fully parsed.
   */
  async connectedCallback() {
    if (!this.initialized) {
      try {
        const originAttribute = this.attributes.getNamedItem('origin');
        const origin = originAttribute ? originAttribute.value : window.location.origin;

        const body = document.createElement('body');
        body.style = 'display: none';
        this.shadowRoot.append(body);

        const styles = document.createElement('link');
        styles.setAttribute('rel', 'stylesheet');
        styles.setAttribute('href', `${origin}/styles/styles.css`);
        styles.onload = () => { body.style = ''; };
        styles.onerror = () => { body.style = ''; };
        this.shadowRoot.appendChild(styles);

        const componentStyles = document.createElement('link');
        componentStyles.setAttribute('rel', 'stylesheet');
        componentStyles.setAttribute('href', `${origin}/blocks/header/aem-header.css`);
        this.shadowRoot.appendChild(componentStyles);

        ['desktop', 'mobile'].forEach((viewport) => {
          const wrapper = document.createElement('div');
          wrapper.classList.add('header-wrapper', `${viewport}-header-wrapper`);
          wrapper.setAttribute('aria-hidden', 'true');
          body.append(wrapper);
        });

        // Set initialized to true so we don't run through this again
        this.initialized = true;

        const isDesktop = window.matchMedia('(min-width: 900px)');
        await this.loadHeaders(body, isDesktop);
        isDesktop.addEventListener('change', () => {
          this.loadHeaders(body, isDesktop);
        });

        body.classList.add('appear');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err || 'An error occured while loading the header');
      }
    }
  }
}

customElements.define('aem-header', AEMHeader);
