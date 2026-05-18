import type { NumberController, ReactiveStore } from './types';
import type { Node } from '../schema/nodes';
import { trigger } from './reactive/deps';

type NumberNode = Extract<Node, { type: 'number' }>;

export function createNumberController(
  path: string,
  key: string,
  state: Record<string, unknown>,
  node: NumberNode,
  store: ReactiveStore
): NumberController {
  const listeners = new Set<(v: number) => void>();
  const disposeListeners = new Set<() => void>();

  return {
    key: path,
    type: node.type,

    min: node.min,
    max: node.max,
    step: node.step,
    label: node.label,
    visible: node.visible,

    get value() {
      return state[key] as number;
    },

    set(v: number) {
      let next = v;

      if (node.min != null) next = Math.max(next, node.min);
      if (node.max != null) next = Math.min(next, node.max);

      if (Object.is(state[key], next)) return;

      state[key] = next;
      trigger(store, path);

      listeners.forEach((fn) => fn(next));
    },

    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

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
