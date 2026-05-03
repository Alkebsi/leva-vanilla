import type {
  AnyController,
  ControlRegistry,
  ControlType,
  InternalFactory,
  ReactiveStore,
} from './types';
import type { Node } from '../schema/nodes';

const registry = new Map<string, InternalFactory<string, AnyController>>();

export function register<K extends ControlType>(
  type: K,
  factory: InternalFactory<K, ControlRegistry[K]['controller']>
) {
  registry.set(
    type,
    factory as unknown as InternalFactory<string, AnyController>
  );
}

export function createController(
  path: string,
  state: Record<string, unknown>,
  key: string,
  node: Node,
  store: ReactiveStore
): AnyController {
  const factory = registry.get(node.type);

  if (!factory) {
    throw new Error(`[leva] No controller registered for type "${node.type}"`);
  }

  return factory(path, key, state, node, store);
}
