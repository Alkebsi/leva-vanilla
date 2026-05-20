import type { Node } from '../schema/nodes';
import { trigger } from './reactive/deps';
import type { BooleanController, ReactiveStore } from './types';

type BooleanNode = Extract<Node, { type: 'boolean' }>;

export function createBooleanController(
  path: string,
  key: string,
  state: Record<string, unknown>,
  node: BooleanNode,
  store: ReactiveStore
): BooleanController {
  const listeners = new Set<(v: boolean) => void>();
  const disposeListeners = new Set<() => void>();
  const visibilityListeners = new Set<(v: boolean) => void>();

  let _visible = node.visible;

  return {
    key: path,
    type: node.type,

    get visible() {
      return _visible;
    },

    set visible(v: boolean) {
      if (_visible === v) return;
      _visible = v;
      visibilityListeners.forEach((fn) => fn(v));
    },

    get value() {
      return state[key] as boolean;
    },

    set(v: boolean) {
      if (Object.is(state[key], v)) return;
      state[key] = Boolean(v);
      trigger(store, path);
      listeners.forEach((fn) => fn(v));
    },

    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    label: node.label,

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
