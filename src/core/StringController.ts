import type { StringController, ReactiveStore } from './types';
import type { Node } from '../schema/nodes';
import { trigger } from './reactive/deps';

type StringNode = Extract<Node, { type: 'string' }>;

export function createStringController(
  path: string,
  key: string,
  state: Record<string, unknown>,
  node: StringNode,
  store: ReactiveStore
): StringController {
  const listeners = new Set<(v: string) => void>();
  const disposeListeners = new Set<() => void>();
  const visibilityListeners = new Set<(v: boolean) => void>();

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
