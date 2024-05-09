import {
  decorateBlock,
  loadBlock,
  buildBlock,
  toClassName,
} from '../../scripts/aem.js';
import { createSlide } from '../carousel/carousel.js';

async function loadSlide(slide) {
  const resp = await fetch(`https://www.macys.com/xapi/digital/v1/product/${slide.dataset.productId}`);
  if (resp.ok) {
    const json = await resp.json();

    const slideRow = document.createElement('div');
    const imageCol = document.createElement('div');
    const product = json.product[0];
    const imgBaseUrl = product.urlTemplate.product;
    imageCol.innerHTML = `
      <a title="${product.detail.name}" href="https://www.macys.com${product.identifier.productUrl}">
        <picture>
          <source type="image/webp" srcset="${imgBaseUrl}/${product.imagery.images[0].filePath}?qlt=85,0&amp;resMode=sharp2&amp;op_usm=1.75,0.3,2,0&amp;fmt=webp&amp;wid=240&amp;hei=300">
          <source type="image/jpeg" srcset="${imgBaseUrl}/${product.imagery.images[0].filePath}?qlt=85,0&amp;resMode=sharp2&amp;op_usm=1.75,0.3,2,0&amp;fmt=jpeg&amp;wid=240&amp;hei=300">
          <img src="${imgBaseUrl}/${product.imagery.images[0].filePath}?qlt=85,0&amp;resMode=sharp2&amp;op_usm=1.75,0.3,2,0&amp;fmt=jpeg&amp;wid=240&amp;hei=300" alt="${product.detail.name}" loading="lazy"  width="240" height="300">
        </picture>
      </a>
    `;
    const contentCol = document.createElement('div');
    contentCol.innerHTML = `
      <a class="product-link" title="${product.detail.name}" href="https://www.macys.com${product.identifier.productUrl}">
        <span>${product.detail.brand.name}</span>
        <h3>${product.detail.name}</h3>
      </a>
    `;
    const productPricing = document.createElement('div');
    productPricing.className = 'product-pricing';
    product.pricing.price.tieredPrice.forEach((price) => {
      const { label, values } = price;
      const formattedLabel = label.replace('[PRICE]', values[0].formattedValue);
      const priceHolder = document.createElement('div');
      priceHolder.className = 'price-holder';
      priceHolder.innerHTML = `<p class="price tiered-price price-${toClassName(values[0].type)}">${formattedLabel}</p>`;
      productPricing.append(priceHolder);
    });
    if (product.pricing.price.finalPrice) {
      const priceHolder = document.createElement('div');
      priceHolder.className = 'price-holder';
      priceHolder.innerHTML = `<p class="price price-final">${product.pricing.price.finalPrice.formattedFinalPrice}</p>`;
      if (product.pricing.price.finalPrice.applicablePromotions) {
        product.pricing.price.finalPrice.applicablePromotions.forEach((promoCode) => {
          const { header } = product.pricing.badgesMap[promoCode];
          const priceHeader = document.createElement('p');
          priceHeader.className = 'price-header';
          priceHeader.textContent = header;
          priceHolder.prepend(priceHeader);
        });
      }
      productPricing.append(priceHolder);
    }
    contentCol.append(productPricing);

    if (product.detail.reviewStatistics.aggregate) {
      const reviews = document.createElement('div');
      reviews.className = 'product-reviews';
      reviews.innerHTML = `<span class="review-stars" style="--rating-pct: ${product.detail.reviewStatistics.aggregate.ratingPercentage}%;"></span><span> (${product.detail.reviewStatistics.aggregate.count})</span>`;
      contentCol.append(reviews);
    }

    slideRow.append(imageCol, contentCol);
    slide.replaceChildren(...createSlide(slideRow, slide.dataset.slideIndex, 0).children);
  }
  slide.classList.remove('loading');
}

/**
 * decorate the carousel block
 * @param {Element} block the block
 */
export default async function decorate(block) {
  const productIds = [];
  const additionalContent = [];
  block.querySelectorAll(':scope > div').forEach((row, rowIndex) => {
    if (rowIndex === 0) {
      const list = row.querySelector('ul');
      if (list) {
        list.querySelectorAll(':scope > li').forEach((item) => {
          productIds.push(item.textContent);
        });
      } else {
        row.querySelectorAll('p').forEach((item) => {
          productIds.push(item.textContent);
        });
      }
    } else {
      row.className = 'additional-content';
      row.querySelectorAll('.button-container').forEach((btnCon) => {
        btnCon.classList.remove('button-container');
        btnCon.querySelectorAll('.button').forEach((btn) => {
          btn.classList.remove('button');
        });
      });
      additionalContent.push(row);
    }
  });
  const carouselContent = [];
  productIds.forEach((productId) => {
    const div = document.createElement('div');
    div.textContent = productId;
    const rowContent = [div];
    carouselContent.push(rowContent);
  });
  const carousel = buildBlock('carousel', carouselContent);
  block.replaceChildren(carousel);
  if (additionalContent.length > 0) {
    block.prepend(...additionalContent);
  }
  decorateBlock(carousel);
  await loadBlock(carousel);

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loadSlide(entry.target);
        slideObserver.unobserve(entry.target);
      }
    });
  });
  carousel.querySelectorAll('.carousel-slide').forEach((slide) => {
    slide.classList.add('loading');
    slide.dataset.productId = slide.textContent.trim();
    slide.textContent = '';
    slideObserver.observe(slide);
  });
}
