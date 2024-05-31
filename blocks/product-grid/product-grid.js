import { getMetadata } from '../../scripts/aem.js';
import invokePageApi from '../../scripts/macys-api.js';
import {
  div, ul, li, a, domEl, button,
} from '../../scripts/dom-helpers.js';

function updateFacets(facetsEl, facets, sorts) {

}

const imgBaseUrl = 'https://slimages.macysassets.com/is/image/MCY/products';

function updateImage(imageContainer, imagery) {
  const createPicture = (filePath) => domEl(
    'picture',
    domEl('source', { type: 'image/webp', srcset: `${imgBaseUrl}/${filePath}?$browse$&wid=400&fmt=webp` }),
    domEl('source', { type: 'image/jpeg', srcset: `${imgBaseUrl}/${filePath}?$browse$&wid=400&fmt=jpeg` }),
    domEl('img', {
      src: `${imgBaseUrl}/${filePath}?$browse$&wid=400&fmt=jpeg`,
      alt: imageContainer.title,
      loading: 'lazy',
      width: 400,
      height: 489,
    }),
  );

  const primaryImagePath = imagery.primaryImage.filePath;

  const picScroller = div(
    { class: 'pic-scroller' },
    createPicture(primaryImagePath),
  );
  imagery.additionalImageSource.forEach((img) => {
    if (img.filePath !== primaryImagePath) {
      picScroller.append(createPicture(img.filePath));
    }
  });

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
    }, 2000);
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

function renderColorSwatches(swatchContainer, imageContainer, colors) {
  const swatchList = ul({ 'data-active-swatch': 0 });
  colors.forEach((color, idx) => {
    const swatchItem = li(
      button(
        { type: 'button', class: 'swatch-button', title: color.name },
        domEl('img', {
          src: `${imgBaseUrl}/${color.swatchImage.filePath}?wid=50&fmt=jpeg`,
          alt: color.name,
          loading: 'lazy',
          width: 50,
          height: 50,
        }),
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
  swatchContainer.append(swatchList);
}

function productCard(product) {
  const item = li(
    div(
      { class: 'product-image' },
      a(
        {
          href: `https://www.macys.com${product.identifier.productUrl}`,
          title: product.detail.name,
        },
      ),
    ),
    div({ class: 'product-colors' }),
    div({ class: 'product-title' }),
    div({ class: 'product-pricing' }),
    div({ class: 'product-ratings' }),
  );

  if (product.traits && product.traits.colors
    && product.traits.colors.colorMap && product.traits.colors.colorMap.length > 1) {
    renderColorSwatches(item.querySelector('.product-colors'), item.querySelector('.product-image a'), product.traits.colors.colorMap);
    updateImage(item.querySelector('.product-image a'), product.traits.colors.colorMap[0].imagery);
  } else {
    updateImage(item.querySelector('.product-image a'), product.imagery);
  }

  return item;
}

function updateGrid(productGrid, sortableGrid) {
  const list = ul();
  sortableGrid.collection.forEach((product) => {
    const item = productCard(product.product);
    list.append(item);
  });
  productGrid.replaceChildren(list);
}

function updatePaging(pagingEl, gridModel) {

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
      console.log(rowSortableGrid);
      const { facets } = rowSortableGrid.zones.find((zone) => zone.facets);
      const { sortableGrid } = rowSortableGrid.zones.find((zone) => zone.sortableGrid);
      updateFacets(facetsEl, facets, sortableGrid.model.sort);
      updateGrid(productGrid, sortableGrid);
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
}
