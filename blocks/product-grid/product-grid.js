import { decorateIcons, getMetadata, toClassName } from '../../scripts/aem.js';
import invokePageApi from '../../scripts/macys-api.js';
import {
  div, ul, li, a, domEl, button, p, span, nav,
} from '../../scripts/dom-helpers.js';

async function updateGrid(block, opts) {
  const update = async () => {
    const facetsEl = block.querySelector('.product-grid-facets');
    const productGrid = block.querySelector('.product-grid-products');
    const pagingEl = block.querySelector('.product-grid-paging');
    Object.entries(opts).forEach(([k, v]) => {
      productGrid.dataset[k] = v;
    });

    // eslint-disable-next-line no-use-before-define
    await renderProductGrid(facetsEl, productGrid, pagingEl);
  };

  document.querySelector('main').classList.add('loading-products');
  block.scrollIntoView({ behavior: 'instant', block: 'start' });
  if (document.startViewTransition) {
    const transition = document.startViewTransition(update);
    await transition.updateCallbackDone;
  } else {
    await update();
  }

  setTimeout(() => { document.querySelector('main').classList.remove('loading-products'); }, 500);
}

function openFilterModel(facets, meta, focus) {
  const dlg = domEl(
    'dialog',
    { class: 'product-grid-filter-dialog' },
    div(
      { class: 'filter-dialog-content' },
      div({ class: 'filter-dialog-header' }, domEl('h2', 'Filters'), button({ type: 'button', class: 'close-dialog', 'aria-label': 'Close' })),
      div({ class: 'filter-dialog-body' }, ul({ class: 'filter-facets' })),
      div({ class: 'filter-dialog-footer' }, button({ type: 'button', disabled: '', class: 'clear-filters secondary' }, 'Clear All'), button({ type: 'button', class: 'apply-filters' }, `View ${meta.itemCount} Items`)),
    ),
  );
  facets.facets.forEach((facet) => {
    const facetEl = li(
      { class: 'filter-facet' },
      button({
        type: 'button', 'data-facet-name': facet.name, 'aria-controls': toClassName(`facet-${facet.name}`), 'aria-expanded': false,
      }, facet.displayName),
      ul({ id: toClassName(`facet-${facet.name}`), class: 'filter-facet-values' }),
    );
    if (facet.values) {
      facet.values.forEach((value) => {
        const facetValue = li(a(
          {
            role: 'checkbox', 'aria-checked': 'false', href: value.url, 'data-value': value.value,
          },
          `${value.displayName} (${value.count})`,
        ));
        if (facet.facetType === 'MULTISELECTSWATCH') {
          // change to color swatches
        } else if (facet.facetType === 'MULTISELECTRATINGS') {
          // add rating stars
          const starsSpan = span({ class: `rating-stars rating-stars-${toClassName(value.value)}` });
          facetValue.querySelector('a').prepend(starsSpan);
        }
        facetValue.addEventListener('click', (evt) => {
          evt.preventDefault();
          const link = facetValue.querySelector('a');
          const expanded = link.getAttribute('aria-checked') === 'true';
          link.setAttribute('aria-checked', !expanded);
        });
        facetEl.querySelector('ul').append(facetValue);
      });
    }

    if (facet.facetType === 'MULTISELECTRANGE') {
      // add range input
    }
    if (facet.facetType === 'MULTISELECTSCROLLBAR') {
      // add scroll and search
    }
    if (facet.facetType === 'MULTISELECTBUTTON') {
      // add select and group by facet.children
    }

    dlg.querySelector('.filter-facets').append(facetEl);
  });
  dlg.querySelectorAll('.filter-facet > button[aria-controls]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !expanded);
    });
  });

  dlg.querySelector('.close-dialog').addEventListener('click', () => {
    document.body.style.overflowY = '';
    dlg.close();
    dlg.remove();
  });
  dlg.addEventListener('click', (event) => {
    const dialogDimensions = dlg.getBoundingClientRect();
    if (event.clientX < dialogDimensions.left || event.clientX > dialogDimensions.right
      || event.clientY < dialogDimensions.top || event.clientY > dialogDimensions.bottom) {
      document.body.style.overflowY = '';
      dlg.close();
      dlg.remove();
    }
  });
  document.body.querySelector('main').append(dlg);
  document.body.style.overflowY = 'hidden';
  dlg.showModal();
  if (focus) {
    const focusEl = dlg.querySelector(`.filter-facet > button[data-facet-name="${focus}"]`);
    if (focusEl) {
      focusEl.setAttribute('aria-expanded', 'true');
      focusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

function updateFacets(facetsEl, facets, gridModel) {
  const { sort, meta } = gridModel;
  console.log(facets);
  const filter = div(
    { class: 'product-filters' },
    button({ class: 'filter-button filter-modal' }, span({ class: 'icon icon-utility-filter' }), 'All Filters'),
  );
  decorateIcons(filter);
  filter.querySelector('.filter-button.filter-modal').addEventListener('click', (evt) => {
    const btn = evt.currentTarget;
    openFilterModel(facets, meta, btn.dataset.filterName);
  });

  const sortEl = div(
    { class: 'product-sorts' },
    div(
      { class: 'select-container' },
      domEl('label', { for: 'sort-select' }, 'Sort by'),
      domEl('select', { id: 'sort-select' }),
    ),
  );
  const selector = sortEl.querySelector('select');
  sort.forEach((sortBy) => {
    const { name, value, isSelected } = sortBy;
    const opt = domEl('option', { value }, name);
    if (isSelected) {
      opt.setAttribute('selected', '');
    }
    selector.append(opt);
  });
  selector.addEventListener('change', () => {
    updateGrid(facetsEl.closest('.product-grid'), {
      sort: selector.value,
    });
  });

  facetsEl.replaceChildren(filter, sortEl);
}

function updatePaging(pagingEl, gridModel) {
  const { perPage, pagination } = gridModel;
  const show = ul(
    { class: 'per-page' },
    li({ class: 'show-text' }, 'Show:'),
    ...perPage.map((perPageOpt) => {
      const buttonOpts = {
        type: 'button',
      };
      if (perPageOpt.isSelected) {
        buttonOpts.disabled = '';
      }
      const pagingOpt = li(
        { class: `per-page-option${perPageOpt.isSelected ? ' selected' : ''}` },
        button(buttonOpts, perPageOpt.name),
      );
      return pagingOpt;
    }),
  );

  show.querySelectorAll('.per-page-option button').forEach((btn) => {
    btn.addEventListener('click', () => {
      updateGrid(pagingEl.closest('.product-grid'), {
        page: 1,
        perPage: btn.textContent,
      });
    });
  });

  const { currentPage, numberOfPages } = pagination;
  const pager = nav({ class: 'pages', 'aria-label': 'Navigate Pages' });
  const navList = ul(li(div(
    { class: 'select-container' },
    domEl('label', { for: 'pages-select' }, 'Page'),
    domEl('select', { id: 'pages-select' }),
  )));
  const selector = navList.querySelector('select');
  const createPageOption = (pageNum) => {
    const opt = domEl('option', { value: pageNum }, `${pageNum} of ${numberOfPages}`);
    if (pageNum === currentPage) {
      opt.setAttribute('selected', '');
    }
    selector.append(opt);
  };
  for (let i = 1; i <= numberOfPages; i += 1) {
    createPageOption(i);
  }
  selector.addEventListener('change', () => {
    updateGrid(pagingEl.closest('.product-grid'), {
      page: selector.value,
    });
  });
  if (currentPage > 1) {
    const prev = li(button({ class: 'page-prev' }, span({ class: 'icon icon-chevron-right' })));
    prev.querySelector('button').addEventListener('click', () => {
      updateGrid(pagingEl.closest('.product-grid'), {
        page: currentPage - 1,
      });
    });
    navList.prepend(prev);
  }
  if (currentPage < numberOfPages) {
    const next = li(button({ class: 'page-next' }, span({ class: 'icon icon-chevron-right' })));
    next.querySelector('button').addEventListener('click', () => {
      updateGrid(pagingEl.closest('.product-grid'), {
        page: currentPage + 1,
      });
    });
    navList.append(next);
  }
  pager.append(navList);
  decorateIcons(pager);

  pagingEl.replaceChildren(show, pager);
}

const imgBaseUrl = 'https://slimages.macysassets.com/is/image/MCY/products';

function updateImage(imageContainer, imagery, eager = false) {
  const createPicture = (filePath) => domEl(
    'picture',
    domEl('source', { type: 'image/webp', srcset: `${imgBaseUrl}/${filePath}?$browse$&wid=400&fmt=webp` }),
    domEl('source', { type: 'image/jpeg', srcset: `${imgBaseUrl}/${filePath}?$browse$&wid=400&fmt=jpeg` }),
    domEl('img', {
      src: `${imgBaseUrl}/${filePath}?$browse$&wid=400&fmt=jpeg`,
      alt: imageContainer.title,
      loading: eager ? 'eager' : 'lazy',
      width: 400,
      height: 489,
    }),
  );

  const primaryImagePath = imagery.primaryImage.filePath;

  const picScroller = div(
    { class: 'pic-scroller' },
    createPicture(primaryImagePath),
  );
  if (imagery.additionalImageSource) {
    imagery.additionalImageSource.forEach((img) => {
      if (img.filePath !== primaryImagePath) {
        picScroller.append(createPicture(img.filePath));
      }
    });
  }

  let scrollInterval;
  picScroller.dataset.activeImage = 0;
  picScroller.addEventListener('mouseenter', () => {
    if (scrollInterval) return;
    scrollInterval = setInterval(() => {
      const activeImage = Number(picScroller.dataset.activeImage);
      let nextImage = activeImage + 1;
      if (nextImage >= picScroller.children.length) {
        nextImage = 0;
      }
      picScroller.dataset.activeImage = nextImage;
      const scrollTo = picScroller.children[nextImage];
      picScroller.scrollTo({
        top: 0,
        left: scrollTo.offsetLeft - picScroller.offsetLeft,
        behavior: 'smooth',
      });
    }, 1800);
  });
  picScroller.addEventListener('mouseleave', () => {
    setTimeout(() => {
      clearInterval(scrollInterval);
      scrollInterval = undefined;
      picScroller.dataset.activeImage = 0;
      picScroller.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
    }, 500);
  });
  imageContainer.replaceChildren(picScroller);
}

function updateColorSwatches(swatchContainer, imageContainer, colors) {
  const swatchList = ul({ 'data-active-swatch': 0 });
  colors.forEach((color, idx) => {
    const swatchItem = li(
      button(
        { type: 'button', class: 'swatch-button', title: color.name },
        domEl(
          'picture',
          domEl('source', { type: 'image/webp', srcset: `${imgBaseUrl}/${color.swatchImage.filePath}?wid=50&fmt=webp` }),
          domEl('source', { type: 'image/jpeg', srcset: `${imgBaseUrl}/${color.swatchImage.filePath}?wid=50&fmt=jpeg` }),
          domEl('img', {
            src: `${imgBaseUrl}/${color.swatchImage.filePath}?wid=50&fmt=jpeg`,
            alt: color.name,
            loading: 'lazy',
            width: 50,
            height: 50,
          }),
        ),
      ),
    );
    const swatchButton = swatchItem.querySelector('.swatch-button');
    if (idx === 0) swatchButton.classList.add('active');
    swatchButton.addEventListener('click', () => {
      swatchList.querySelector('.swatch-button.active').classList.remove('active');
      swatchButton.classList.add('active');

      const isActiveSwatch = Number(swatchList.dataset.activeSwatch) === idx;
      if (!isActiveSwatch) {
        swatchList.dataset.activeSwatch = idx;
        updateImage(imageContainer, color.imagery);
      }
    });
    ['focus', 'mouseenter'].forEach((eventName) => {
      swatchButton.addEventListener(eventName, () => {
        const isActiveSwatch = Number(swatchList.dataset.activeSwatch) === idx;
        if (!isActiveSwatch) {
          swatchList.dataset.activeSwatch = idx;
          updateImage(imageContainer, color.imagery);
        }
      });
    });
    swatchButton.addEventListener('blur', () => {
      swatchList.querySelector('.swatch-button.active').click();
    });
    swatchList.append(swatchItem);
  });
  swatchList.addEventListener('mouseleave', () => {
    swatchList.querySelector('.swatch-button.active').click();
  });
  swatchContainer.replaceChildren(swatchList);
}

function createProductCard(product, eager) {
  const {
    pricing, identifier, detail, traits, imagery,
  } = product;
  const item = li(
    { class: 'product-card' },
    div(
      { class: 'product-image' },
      a(
        {
          href: `https://www.macys.com${identifier.productUrl}`,
          title: detail.name,
        },
      ),
    ),
    div(
      { class: 'product-content' },
      div({ class: 'product-title' }),
      div({ class: 'product-pricing' }),
    ),
  );

  if (traits && traits.colors
    && traits.colors.colorMap && traits.colors.colorMap.length > 1) {
    const colors = div({ class: 'product-colors' });
    updateColorSwatches(colors, item.querySelector('.product-image a'), traits.colors.colorMap);
    item.querySelector('.product-content').prepend(colors);
    updateImage(item.querySelector('.product-image a'), traits.colors.colorMap[0].imagery, eager);
  } else {
    updateImage(item.querySelector('.product-image a'), imagery, eager);
  }

  if (detail.bottomOverlay) {
    const overlay = div({ class: `bottom-overlay ${detail.bottomOverlay.classes.join(' ')}` }, detail.bottomOverlay.text);
    item.querySelector('.product-image').after(overlay);
  }

  item.querySelector('.product-title').append(a(
    { class: 'product-link', title: detail.name, href: `https://www.macys.com${identifier.productUrl}` },
    p(detail.brand),
    p(detail.name),
  ));
  item.querySelectorAll('.product-link p').forEach((par) => {
    // decode the html entities, e.g &quot;
    const temp = div();
    temp.innerHTML = par.textContent;
    par.textContent = temp.textContent;
  });

  // pricing
  const pricingContainer = item.querySelector('.product-pricing');
  if (pricing.price.priceType.text) {
    const priceType = span({ class: `price-type ${toClassName(pricing.price.priceType.text)}` }, pricing.price.priceType.text);
    item.querySelector('.product-image').append(priceType);
  }

  pricing.price.tieredPrice.forEach((price) => {
    const { label, values } = price;
    const formattedLabel = label.replace('[PRICE]', values[0].formattedValue);
    const priceHolder = div({ class: 'price-holder tiered-price' }, p({ class: `price price-${toClassName(values[0].type)}` }, formattedLabel));

    pricingContainer.append(priceHolder);
  });

  if (pricing.badges) {
    pricing.badges.forEach((priceBadge) => {
      if (priceBadge.header) {
        const priceHolder = div({ class: 'price-holder price-badge' }, p({ class: 'price price-badge-header' }, priceBadge.header));
        if (priceBadge.description) {
          priceHolder.classList.add('price-badge-tooltip');
          const toolTip = div({ class: 'price-tooltip' }, p({ class: 'tooltip-header' }, priceBadge.header), p(priceBadge.description));
          priceHolder.append(toolTip);
        }
        pricingContainer.append(priceHolder);
      } else if (priceBadge.finalPrice) {
        const { label, values } = priceBadge.finalPrice;
        const priceHolder = div({ class: 'price-holder price-badge' }, p({ class: 'price price-badge-final-price' }));
        values.forEach((val, i) => {
          const valEl = span({ class: toClassName(val.type) });
          if (i === 0) {
            const formattedLabel = label.replace('[PRICE]', val.formattedValue);
            valEl.append(formattedLabel);
          } else {
            const formattedLabel = ` - ${val.formattedValue}`;
            valEl.append(formattedLabel);
          }

          priceHolder.querySelector('.price').append(valEl);
        });
        pricingContainer.append(priceHolder);
      }
    });
  }

  // ratings
  if (detail.reviewStatistics.aggregate) {
    const ratingPct = Math.round((detail.reviewStatistics.aggregate.rating / 5) * 100);
    const reviews = div(
      { class: 'product-reviews' },
      span({ class: 'review-stars', style: `--rating-pct: ${ratingPct}%;` }),
      span(`(${product.detail.reviewStatistics.aggregate.count})`),
    );
    item.append(reviews);
  }

  // more like this?

  return item;
}

function updateProducts(productGrid, sortableGrid) {
  const list = ul({ class: 'product-list' });
  productGrid.replaceChildren(list);

  const loadAndObserve = (toLoad, observer, eager) => {
    toLoad.forEach((product, idx) => {
      if (product.product) {
        const item = createProductCard(product.product, eager && idx === 0);
        list.append(item);
        if (idx === (toLoad.length - 1)) {
          observer.observe(item);
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn('proudct not defined', product);
      }
    });
  };

  const loadCount = 8;
  let first = sortableGrid.collection.slice(0, loadCount);
  let rest = sortableGrid.collection.slice(loadCount);
  const loadMoreObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loadMoreObserver.unobserve(entry.target);
        first = rest.slice(0, loadCount);
        rest = rest.slice(loadCount);
        loadAndObserve(first, loadMoreObserver, false);
      }
    });
  }, { rootMargin: '150px' });
  loadAndObserve(first, loadMoreObserver, true);
}

function updateMeta(gridModelMeta) {
  const h1 = document.querySelector('h1');
  if (h1) {
    h1.textContent = `${gridModelMeta.currentCategoryName} (${gridModelMeta.itemCount})`;
  }
}

async function renderProductGrid(facetsEl, productGrid, pagingEl) {
  const resp = await invokePageApi(window.location.pathname, productGrid.dataset.category, {
    pageIndex: productGrid.dataset.page,
    productsPerPage: productGrid.dataset.perPage,
    sortBy: productGrid.dataset.sort,
  });
  if (resp.ok) {
    const json = await resp.json();
    if (json && json.body && json.body.canvas && json.body.canvas.rows) {
      const { rowSortableGrid } = json.body.canvas.rows.find((row) => row.rowSortableGrid);
      const { facets } = rowSortableGrid.zones.find((zone) => zone.facets);
      const { sortableGrid } = rowSortableGrid.zones.find((zone) => zone.sortableGrid);
      updateFacets(facetsEl, facets, sortableGrid.model, sortableGrid.model);
      updateProducts(productGrid, sortableGrid);
      updatePaging(pagingEl, sortableGrid.model);
      updateMeta(sortableGrid.model.meta);
    }
  }
}

/**
 * decorate the product grid block
 * @param {Element} block the block
 */
export default async function decorate(block) {
  const load = () => {
    const catId = getMetadata('category-id');
    if (catId) {
      const facets = div({ class: 'product-grid-facets' });
      const productGrid = div({
        class: 'product-grid-products',
        'data-page': '1',
        'data-per-page': '60',
        'data-sort': 'ORIGINAL',
        'data-category': catId,
      });
      const paging = div({ class: 'product-grid-paging' });
      renderProductGrid(facets, productGrid, paging);
      block.replaceChildren(facets, productGrid, paging);
    }
  };
  const blockObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        blockObserver.disconnect();
        load();
      }
    });
  });
  blockObserver.observe(block);

  document.querySelector('main').append(div({ class: 'loading-products-overlay' }));
}
