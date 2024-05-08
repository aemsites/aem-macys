import { fetchPlaceholders } from '../../scripts/aem.js';

function updateSlideVisibility(slide, visible = true) {
  slide.setAttribute('aria-hidden', !visible);
  slide.querySelectorAll('a').forEach((link) => {
    if (!visible) {
      link.setAttribute('tabindex', '-1');
    } else {
      link.removeAttribute('tabindex');
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  const activeSlide = slides[slideIndex];

  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  block.querySelector('.slide-prev').addEventListener('click', () => {
    let firstFullyShown = -1;
    let fullyShownCount = 0;
    const slides = block.querySelectorAll('.carousel-slide');
    slides.forEach((slide) => {
      if (slide.dataset.fullyShown === 'true') {
        fullyShownCount += 1;
        if (firstFullyShown === -1) {
          firstFullyShown = parseInt(slide.dataset.slideIndex, 10);
        }
      }
    });
    let slideToShow = firstFullyShown - fullyShownCount;
    if (slideToShow < 0) {
      if (firstFullyShown === 0) {
        slideToShow = slides.length - 1;
      } else {
        slideToShow = 0;
      }
    }

    showSlide(block, slideToShow);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    let lastFullyShown = -1;
    const slides = block.querySelectorAll('.carousel-slide');
    slides.forEach((slide) => {
      if (slide.dataset.fullyShown === 'true') {
        lastFullyShown = parseInt(slide.dataset.slideIndex, 10);
      }
    });
    let slideToShow = lastFullyShown + 1;
    if (slideToShow > (slides.length - 1)) {
      slideToShow = 0;
    }
    showSlide(block, slideToShow);
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        updateSlideVisibility(entry.target, true);
        entry.target.dataset.fullyHidden = false;
      } else {
        updateSlideVisibility(entry.target, false);
        entry.target.dataset.fullyHidden = true;
      }

      if (entry.intersectionRatio === 1) {
        entry.target.dataset.fullyShown = true;
      } else {
        entry.target.dataset.fullyShown = false;
      }
    });
  }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

  const cols = row.querySelectorAll(':scope > div');
  cols.forEach((column, colIdx) => {
    column.classList.add(`carousel-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

let carouselId = 0;

/**
 * decorate the carousel block
 * @param {Element} block the block
 */
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-${carouselId}`);
  const rows = block.querySelectorAll(':scope > div');

  const placeholders = await fetchPlaceholders();

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');
  block.prepend(slidesWrapper);

  const slideNavButtons = document.createElement('div');
  slideNavButtons.classList.add('carousel-navigation-buttons');
  slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
      <button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
    `;

  container.append(slideNavButtons);

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  bindEvents(block);
  showSlide(block, 0);
}
