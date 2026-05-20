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
  const disposeListeners = new Set<() => void>();
  const visibilityListeners = new Set<(v: boolean) => void>();

  const initial = parseColor(state[key]);
  const formatInfo = initial?.info || { kind: 'string', type: 'rgb', max: 255 };

  let _visible = node.visible;

  return {
    key: path,
    type: node.type,
    label: node.label,

    get visible() {
      return _visible;
    },

    set visible(v: boolean) {
      if (_visible === v) return;
      _visible = v;
      visibilityListeners.forEach((fn) => fn(v));
    },

    get value() {
      return state[key] as ColorValue;
    },

    set(v: ColorValue) {
      if (Object.is(state[key], v)) return;

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
