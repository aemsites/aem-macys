import { removeButtons } from '../../scripts/scripts.js';

/**
 * decorate the cards block
 * @param {Element} block  the block
 */
export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    let cardLink;
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-card-image';
      } else {
        div.className = 'cards-card-body';
        cardLink = div.querySelector('a');
        removeButtons(div);
      }
    });
    if (cardLink) {
      const cloned = cardLink.cloneNode(false);
      const imgDiv = li.querySelector('.cards-card-image');
      if (imgDiv) {
        cloned.append(imgDiv.querySelector('picture'));
        imgDiv.append(cloned);
      }
    }
    ul.append(li);
  });
  block.replaceChildren(ul);
}
