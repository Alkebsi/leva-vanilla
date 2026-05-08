import type { ColorController, ReactiveStore } from './types';
import type { Node } from '../schema/nodes';
import { trigger } from './reactive/deps';

type ColorNode = Extract<Node, { type: 'color' }>;

export function createColorController(
  path: string,
  key: string,
  state: Record<string, unknown>,
  node: ColorNode,
  store: ReactiveStore
): ColorController {
  const listeners = new Set<(v: string) => void>();

  return {
    key: path,
    type: node.type,

    label: node.label,

    get value() {
      return state[key] as string;
    },

    set(v: string) {
      if (Object.is(state[key], v)) return;

      state[key] = v;
      trigger(store, path);

      listeners.forEach((fn) => fn(v));
    },

    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
