export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-card-image';
      } else {
        div.className = 'cards-card-body';
        div.querySelectorAll('.button-container').forEach((btnCon) => {
          btnCon.classList.remove('button-container');
          btnCon.querySelectorAll('.button').forEach((btn) => {
            btn.classList.remove('button');
          });
        });
      }
    });
    ul.append(li);
  });
  block.replaceChildren(ul);
}
