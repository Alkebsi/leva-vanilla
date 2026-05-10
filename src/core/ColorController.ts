import type { ColorController, ReactiveStore } from './types';
import type { Node } from '../schema/nodes';
import { trigger } from './reactive/deps';
import { parseColor, formatColor } from '../utils/color';
import type { ColorValue } from '../utils/types';

type ColorNode = Extract<Node, { type: 'color' }>;

export function createColorController(
  path: string,
  key: string,
  state: Record<string, unknown>,
  node: ColorNode,
  store: ReactiveStore
): ColorController {
  const listeners = new Set<(v: ColorValue) => void>();

  // Detect initial format info
  const initial = parseColor(state[key]);
  const formatInfo = initial?.info || { kind: 'string', type: 'rgb', max: 255 };

  return {
    key: path,
    type: node.type,
    label: node.label,

    get value() {
      return state[key] as ColorValue;
    },

    set(v: ColorValue) {
      if (Object.is(state[key], v)) return;

      // If the incoming value is a string (e.g. from the Hex picker),
      // convert it back to the original format shape.
      const parsed = parseColor(v);
      const finalValue = parsed ? formatColor(parsed.rgba, formatInfo) : v;

      state[key] = finalValue;
      trigger(store, path);
      listeners.forEach((fn) => fn(finalValue));
    },

    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
