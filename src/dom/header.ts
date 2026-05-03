import icons from '../icons';

export function createHeader() {
  const header = document.createElement('div');
  header.className = 'leva__header';

  const dropdown = document.createElement('div');
  dropdown.className = 'leva__icons leva__icons--dropdown-icon';
  dropdown.innerHTML = icons.downArrow;

  const grab = document.createElement('div');
  grab.className = 'leva__icons leva__icons--grab-icon';
  grab.innerHTML = icons.grab;

  const search = document.createElement('div');
  search.className = 'leva__icons leva__icons--search-icon';
  search.innerHTML = icons.search;

  header.appendChild(dropdown);
  header.appendChild(grab);
  header.appendChild(search);

  return header;
}
