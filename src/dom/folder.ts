import icons from '../icons';
import type { FolderSettings } from '../schema/descriptors';

export function createFolder(
  parent: HTMLElement,
  name: string,
  settings: FolderSettings = {}
) {
  const wrapper = document.createElement('div');
  wrapper.className = 'leva__folder';

  const isNested = parent.classList.contains('leva__folder-content');
  const isSubsequent = parent.children.length > 0;

  if (isNested) {
    wrapper.classList.add('leva__folder--nested');
    if (isSubsequent) {
      wrapper.classList.add('leva__folder--subsequent');
    }
  }

  const header = document.createElement('div');
  header.className = 'leva__folder-header';

  const headerTitle = document.createElement('div');
  headerTitle.textContent =
    settings.label !== undefined ? String(settings.label) : name;
  header.innerHTML = icons.downArrow;
  header.append(headerTitle);

  const content = document.createElement('div');
  content.className = 'leva__content leva__folder-content';

  const observer = new MutationObserver(() => {
    if (content.children.length === 0) destroy();
  });
  observer.observe(content, { childList: true });

  wrapper.appendChild(header);
  wrapper.appendChild(content);
  parent.appendChild(wrapper);

  let isOpen = settings.collapsed === true ? false : true;
  let currentAngle = isOpen ? 0 : -90;

  if (!isOpen) {
    content.style.display = 'none';
    content.style.opacity = '0';
    content.style.height = '0px';
    const headerIcon = header.firstElementChild as HTMLElement | null;
    if (headerIcon) headerIcon.style.transform = 'rotate(-90deg)';
  }

  let heightAnim: Animation | undefined;
  let opacityAnim: Animation | undefined;

  const toggle = (closeOnly?: boolean) => {
    const wasOpen = isOpen;
    const targetOpen = closeOnly ? false : !wasOpen;
    if (targetOpen === wasOpen && !closeOnly) return;

    isOpen = targetOpen;

    const currentHeight = content.getBoundingClientRect().height;
    const currentOpacity = window.getComputedStyle(content).opacity;
    const headerIcon = header.firstElementChild as HTMLElement | null;
    const startAngle = currentAngle;
    currentAngle = isOpen ? 0 : -90;

    content.getAnimations().forEach((anim) => anim.cancel());
    heightAnim?.cancel();
    opacityAnim?.cancel();

    if (isOpen) {
      content.style.display = '';
      content.style.overflow = 'hidden';

      const toHeight = content.scrollHeight;

      heightAnim = content.animate(
        [{ height: `${currentHeight}px` }, { height: `${toHeight}px` }],
        { duration: closeOnly ? 0 : 350, easing: 'ease', fill: 'forwards' }
      );

      opacityAnim = content.animate(
        [{ opacity: currentOpacity }, { opacity: 1 }],
        {
          duration: closeOnly ? 0 : 200,
          delay: closeOnly ? 0 : 200,
          easing: 'ease-out',
          fill: 'both',
        }
      );

      if (headerIcon) {
        headerIcon.animate(
          [
            { transform: `rotate(${startAngle}deg)` },
            { transform: 'rotate(0deg)' },
          ],
          { duration: closeOnly ? 0 : 350, easing: 'ease', fill: 'forwards' }
        );
      }

      heightAnim.onfinish = () => {
        if (isOpen) {
          content.style.height = 'auto';
          content.style.overflow = '';
          heightAnim?.cancel();
          heightAnim = undefined;
        }
      };
    } else {
      content.style.overflow = 'hidden';

      heightAnim = content.animate(
        [
          { height: `${currentHeight}px`, opacity: currentOpacity },
          { height: `0px`, opacity: 0 },
        ],
        { duration: closeOnly ? 0 : 350, easing: 'ease', fill: 'forwards' }
      );

      if (headerIcon) {
        headerIcon.animate(
          [
            { transform: `rotate(${startAngle}deg)` },
            { transform: 'rotate(-90deg)' },
          ],
          { duration: closeOnly ? 0 : 350, easing: 'ease', fill: 'forwards' }
        );
      }

      heightAnim.onfinish = () => {
        if (!isOpen) {
          content.style.display = 'none';
          content.style.height = '';
          content.style.opacity = '0';
        }
        content.style.overflow = '';
        heightAnim?.cancel();
        heightAnim = undefined;
      };
    }
  };

  header.onclick = () => toggle();

  const destroy = () => {
    header.onclick = null;
    observer.disconnect();
    heightAnim?.cancel();
    opacityAnim?.cancel();
    wrapper.remove();
  };

  return { wrapper, header, content, toggle, isOpen: () => isOpen, destroy };
}
