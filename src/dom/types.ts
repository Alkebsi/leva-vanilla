import type { AnyController, ReactiveStore } from '../core/types';
import type { Node } from '../schema/nodes';

export type Controls = {
  _tree: Record<string, Node>;
  _controllers: Record<string, AnyController> & {
    _store?: ReactiveStore;
    _state?: Record<string, unknown>;
  };
  effect: (fn: () => void) => () => void;
  remove: (path: string) => void;
};
