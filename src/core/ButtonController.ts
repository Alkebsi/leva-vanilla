import type { ButtonController, ReactiveStore } from './types';
import type { Node } from '../schema/nodes';

type ButtonNode = Extract<Node, { type: 'button' }>;

export function createButtonController(
  path: string,
  _key: string,
  _state: Record<string, unknown>,
  node: ButtonNode,
  _store: ReactiveStore
): ButtonController {
  void _store;
  const disposeListeners = new Set<() => void>();
  const visibilityListeners = new Set<(v: boolean) => void>();

  let _visible = node.visible;

  return {
    key: path,
    type: node.type,
    trigger: node.trigger,
    label: node.label,
    disabled: node.disabled,

    get visible() {
      return _visible;
    },

    set visible(v: boolean) {
      if (_visible === v) return;
      _visible = v;
      visibilityListeners.forEach((fn) => fn(v));
    },

    dispose() {
      disposeListeners.forEach((fn) => fn());
      disposeListeners.clear();
    },

    onDispose(fn) {
      disposeListeners.add(fn);
      return () => disposeListeners.delete(fn);
    },

    onVisibleChange(fn) {
      visibilityListeners.add(fn);
      return () => visibilityListeners.delete(fn);
    },
  };
}
