export function createRow() {
  const container = document.createElement('div');
  container.className = 'leva__row-container';

  const row = document.createElement('div');
  row.className = 'leva__row';

  const labelContainer = document.createElement('div');
  labelContainer.className = 'leva__label-container';
  const label = document.createElement('label');
  label.className = 'leva__label';

  labelContainer.append(label);

  const control = document.createElement('div');
  control.className = 'leva__control';

  row.append(labelContainer, control);
  container.append(row);

  return { container, row, label, labelContainer, control };
}
