import type { ReactiveStore, SelectController } from './types';
import type { Node } from '../schema/nodes';
import { trigger } from './reactive/deps';

type SelectNode = Extract<Node, { type: 'select' }>;

export function createSelectController(
  path: string,
  key: string,
  state: Record<string, unknown>,
  node: SelectNode,
  store: ReactiveStore
): SelectController {
  const options = node.options;
  const listeners = new Set<(v: string | number) => void>();

  const isValid = (v: string | number) => options.some((o) => o.value === v);

  return {
    key: path,
    type: node.type,
    label: node.label,

    get value() {
      return state[key] as string | number;
    },

    set(v: string | number) {
      if (!isValid(v)) {
        throw new Error(`[leva] Invalid select value "${v}" for "${path}"`);
      }

      if (Object.is(state[key], v)) return;

      state[key] = v;
      trigger(store, path);

      listeners.forEach((fn) => fn(v));
    },

    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    options,
  };
}
