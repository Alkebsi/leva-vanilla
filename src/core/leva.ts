import normalize from '../schema/normalize';
import type { Node } from '../schema/nodes';
import { createStateProxy } from './reactive/proxy';
import { effect } from './reactive/effect';
import { createStore } from './reactive/deps';
import { registerDefaults } from './bootstrap';
import { createController } from './registry';
import type {
  AnyController,
  InferState,
  ReactiveStore,
  Schema,
  ValidateSchema,
} from './types';
import { mountDOM } from '../dom/gui';

/* ---------------------------------- */
/* Options                           */
/* ---------------------------------- */

type LevaOptions = {
  collapsed?: boolean;
  title?: string;
  gui?: boolean;
};

export type LevaStore = {
  _tree: Record<string, Node>;
  _controllers: Record<string, AnyController>;
  effect: (fn: () => void) => () => void;
};

/* ---------------------------------- */
/* Public API                        */
/* ---------------------------------- */

type ReservedKeys = 'effect' | '_tree' | '_controllers';
const RESERVED_KEYS = ['effect', '_tree', '_controllers'] as const;

type NoReservedKeys<T> = {
  [K in keyof T]: K extends ReservedKeys
    ? `Error: "${K}" is a reserved keyword and cannot be used as a control name.`
    : unknown;
};

type DeepWritable<T> = {
  -readonly [P in keyof T]: DeepWritable<T[P]>;
};

export function leva<const T extends Schema>(
  schema: T & ValidateSchema<T> & NoReservedKeys<T>,
  options?: LevaOptions
): DeepWritable<InferState<T>> & { effect: (fn: () => void) => () => void } {
  registerDefaults();

  for (const key in schema) {
    if ((RESERVED_KEYS as readonly string[]).includes(key)) {
      throw new Error(
        `[leva] "${key}" is a reserved keyword and cannot be used as a control name.`
      );
    }
  }

  const tree = normalize(schema as unknown as Parameters<typeof normalize>[0]);

  const store = createStore();
  const state: Record<string, unknown> = {};
  const controllers: Record<string, AnyController> = {};

  const boundEffect = (fn: () => void) => effect(store, fn);

  Object.defineProperties(state, {
    _tree: { value: tree, enumerable: false },
    _controllers: { value: controllers, enumerable: false },
    effect: { value: boundEffect, enumerable: false },
  });

  const proxy = createStateProxy(state, controllers, store);
  const controls = proxy as DeepWritable<InferState<T>> & LevaStore;

  build(tree, state, controllers, store);

  if (options?.gui !== false) {
    mountDOM(controls, {
      title: options?.title,
      collapsed: options?.collapsed,
    });
  }

  return controls;
}

/* ---------------------------------- */
/* Build tree → state + controllers  */
/* ---------------------------------- */

function build(
  tree: Record<string, Node>,
  state: Record<string, unknown>,
  controllers: Record<string, AnyController>,
  store: ReactiveStore,
  path: string[] = []
) {
  for (const key in tree) {
    if (key === '$') continue;

    const node = tree[key];
    const fullPath = [...path, key];

    // -------------------------
    // Folder (recursive namespace)
    // -------------------------
    if (node.type === 'folder') {
      if (
        !(key in state) ||
        typeof state[key] !== 'object' ||
        state[key] === null
      ) {
        state[key] = {};
      }
      const subState = state[key] as Record<string, unknown>;
      build(node.children, subState, controllers, store, fullPath);
      continue;
    }

    // -------------------------
    // Nested state assignment
    // -------------------------
    if ('value' in node) {
      state[key] = (node as Extract<Node, { value: unknown }>).value;
    }

    // -------------------------
    // Controller creation
    // -------------------------
    const pathString = fullPath.join('.');
    controllers[pathString] = createController(
      pathString,
      state,
      key,
      node,
      store
    );
  }
}
