import { removeButtons } from '../../scripts/scripts.js';

/**
 * decorate the banner block
 * @param {Element} block the block
 */
export default async function decorate(block) {
  block.querySelectorAll(':scope > div').forEach((row) => {
    row.querySelectorAll(':scope > div').forEach((col) => {
      if (col.querySelector('picture')) {
        col.classList.add('banner-image');
      } else {
        col.classList.add('banner-content');
        removeButtons(col);
      }
    });
  });
}
