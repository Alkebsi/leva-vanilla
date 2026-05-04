import icons from '../../icons';

export function createRow(getValue?: () => unknown) {
  const container = document.createElement('div');
  container.className = 'leva__row-container';

  const row = document.createElement('div');
  row.className = 'leva__row';

  const labelContainer = document.createElement('div');
  labelContainer.className = 'leva__label-container';
  const label = document.createElement('label');
  label.className = 'leva__label';

  const clipboardBtn = document.createElement('div');
  clipboardBtn.className = 'leva__clipboard-btn';
  clipboardBtn.innerHTML = icons.clipboard;

  labelContainer.append(label, clipboardBtn);

  const control = document.createElement('div');
  control.className = 'leva__control';

  row.append(labelContainer, control);
  container.append(row);

  let isAnimating = false;

  const runFlash = () => {
    if (isAnimating) return;
    isAnimating = true;

    const anim = control.animate(
      [
        { left: '-100%', offset: 0 },
        { left: '0%', offset: 0.2 },
        { left: '0%', offset: 0.8 },
        { left: '100%', offset: 1 },
      ],
      {
        duration: 700,
        easing: 'ease-in-out',
        pseudoElement: '::before',
        fill: 'none',
      }
    );

    anim.onfinish = () => {
      isAnimating = false;
    };
  };

  if (getValue) {
    setupCopy(clipboardBtn, runFlash, getValue);
  }

  return {
    container,
    row,
    label,
    labelContainer,
    control,
    clipboardBtn,
    runFlash,
  };
}

export function setupCopy(
  clipboardBtn: HTMLElement,
  runFlash: () => void,
  getValue: () => unknown
) {
  clipboardBtn.onclick = async () => {
    const value = getValue();
    const textToCopy =
      typeof value === 'object'
        ? JSON.stringify(value, null, 2)
        : String(value);
    try {
      await navigator.clipboard.writeText(textToCopy);
      runFlash();
    } catch (err) {
      console.error('[leva] Copy failed', err);
    }
  };
}
