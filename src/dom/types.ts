import type { AnyController } from '../core/types';
import type { Node } from '../schema/nodes';

export type Controls = {
  _tree: Record<string, Node>;
  _controllers: Record<string, AnyController>;
  effect: (fn: () => void) => () => void;
};
