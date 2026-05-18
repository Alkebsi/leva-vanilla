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

  return {
    key: path,
    type: node.type,
    trigger: node.trigger,
    label: node.label,
    visible: node.visible,
    disabled: node.disabled,
    dispose() {
      disposeListeners.forEach((fn) => fn());
      disposeListeners.clear();
    },
    onDispose(fn) {
      disposeListeners.add(fn);
      return () => disposeListeners.delete(fn);
    },
  };
}
