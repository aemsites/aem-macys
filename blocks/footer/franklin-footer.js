import decorate from './footer.js';
import { buildBlock, decorateBlock } from '../../scripts/aem.js';

// eslint-disable-next-line import/prefer-default-export
export class FranklinFooter extends HTMLElement {
  constructor() {
    super();

    // Attaches a shadow DOM tree to the element
    // With mode open the shadow root elements are accessible from JavaScript outside the root
    this.attachShadow({ mode: 'open' });

    // Keep track if we have rendered the fragment yet.
    this.initialized = false;
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

        const blockStyles = document.createElement('link');
        blockStyles.setAttribute('rel', 'stylesheet');
        blockStyles.setAttribute('href', `${origin}/blocks/footer/footer.css`);
        this.shadowRoot.appendChild(blockStyles);

        // Set initialized to true so we don't run through this again
        this.initialized = true;

        const wrapper = document.createElement('div');
        body.append(wrapper);
        const block = buildBlock('footer', '');
        wrapper.append(block);
        decorateBlock(block);

        decorate(block);
        body.classList.add('appear');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err || 'An error occured while loading the fragment');
      }
    }
  }
}

customElements.define('franklin-footer', FranklinFooter);
