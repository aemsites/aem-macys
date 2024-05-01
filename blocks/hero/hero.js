import { div } from '../../scripts/dom-helpers.js';

function decorateImages(imgContainer) {
  imgContainer.dataset.displayIndex = 0;
  imgContainer.dataset.autoScroll = true;
  imgContainer.dataset.autoScrollSkip = false;
  setInterval(() => {
    if (imgContainer.dataset.autoScroll === 'true' && imgContainer.dataset.autoScrollSkip === 'false') {
      const displayIndex = parseInt(imgContainer.dataset.displayIndex, 10) + 1;
      let realDisplayIndex = displayIndex < 0 ? imgContainer.children.length - 1 : displayIndex;
      if (displayIndex >= imgContainer.children.length) realDisplayIndex = 0;
      const toDisplay = imgContainer.children[realDisplayIndex];
      imgContainer.scrollTo({
        top: 0,
        left: toDisplay.offsetLeft,
        behavior: 'smooth',
      });
      imgContainer.dataset.displayIndex = realDisplayIndex;
    }
    imgContainer.dataset.autoScrollSkip = false;
  }, 5000);
  imgContainer.addEventListener('mouseover', () => {
    imgContainer.dataset.autoScroll = false;
  });
  imgContainer.addEventListener('mouseout', () => {
    imgContainer.dataset.autoScroll = true;
    imgContainer.dataset.autoScrollSkip = true;
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        imgContainer.dataset.autoScroll = true;
        imgContainer.dataset.autoScrollSkip = true;
      } else {
        imgContainer.dataset.autoScroll = false;
      }
    });
  });
  observer.observe(imgContainer);
}

/**
 * decorates the hero
 * @param {Element} block The hero block element
 */
export default async function decorate(block) {
  const headingContainer = div({ class: 'heading-container' });
  const textContainer = div({ class: 'text-container' });
  const imgContainer = div({ class: 'img-container' });
  block.querySelectorAll(':scope > div > div').forEach((col) => {
    [...col.children].forEach((el) => {
      if (el.tagName === 'H1' || el.tagName === 'H2') {
        headingContainer.append(el);
      } else if (el.tagName === 'PICTURE' || el.querySelector('picture')) {
        if (el.tagName === 'P' && el.children.length === 1) {
          imgContainer.append(el.children[0]);
        } else {
          imgContainer.append(el);
        }
      } else {
        textContainer.append(el);
      }
    });
  });
  decorateImages(imgContainer);
  block.replaceChildren(headingContainer, imgContainer, textContainer);
}
