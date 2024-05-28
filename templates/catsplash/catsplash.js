/**
 * decorate the catsplash page
 * @param {Document} doc the document element
 */
export default async function decorateTemplate(doc) {
  let rowCount = 0;
  doc.querySelectorAll('main > div').forEach((section) => {
    if (section.querySelector('.category-nav')) {
      doc.querySelector('main').classList.add('grid');
      section.classList.add('left-nav');
    } else {
      rowCount += 1;
    }
  });
  doc.querySelector('main').style.setProperty('--row-count', rowCount);
}
