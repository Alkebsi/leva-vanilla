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
  void _store; // remove unused vars while keeping contract

  return {
    key: path,
    type: node.type,
    trigger: node.trigger,
    label: node.label,
    disabled: node.disabled,
  };
}
