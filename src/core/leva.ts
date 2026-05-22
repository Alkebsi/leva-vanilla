import normalize from '../schema/normalize';
import type { Node } from '../schema/nodes';
import { createStateProxy } from './reactive/proxy';
import { effect } from './reactive/effect';
import { createStore, trigger } from './reactive/deps';
import { registerDefaults } from './bootstrap';
import { createController } from './registry';
import type {
  AnyController,
  ExtractValues,
  LevaOptions,
  LevaStore,
  ReactiveStore,
  Schema,
  ValidateSchema,
} from './types';
import { mountDOM } from '../dom/gui';

/* ---------------------------------- */
/* Public API                        */
/* ---------------------------------- */

type ReservedKeys =
  | 'effect'
  | 'remove'
  | 'visibility'
  | '_tree'
  | '_controllers';
const RESERVED_KEYS = [
  'effect',
  'remove',
  'visibility',
  '_tree',
  '_controllers',
] as const;

type NoReservedKeys<T> = {
  [K in keyof T]: K extends ReservedKeys
    ? `Error: "${K}" is a reserved keyword and cannot be used as a control name.`
    : unknown;
};

export function leva<const T extends Schema>(
  schema: T & ValidateSchema<T> & NoReservedKeys<T>,
  options?: LevaOptions
) {
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

  const activeEffects = new Set<() => void>();
  const boundEffect = (fn: () => void) => {
    const unSub = effect(store, fn);
    activeEffects.add(unSub);

    return () => {
      unSub();
      activeEffects.delete(unSub);
    };
  };

  let guiInstance: { dispose: () => void } | undefined;

  const visibility = (path: string, value: boolean) => {
    const prefix = path + '.';

    Object.keys(controllers).forEach((key) => {
      if (key === path || key.startsWith(prefix)) {
        controllers[key].visible = value;
      }
    });

    const folderEl = document.querySelector(
      `.leva__folder[data-path="${path}"]`
    ) as HTMLElement;
    if (folderEl) folderEl.style.display = value ? '' : 'none';
  };

  const remove = (path: string) => {
    const controller = controllers[path];
    if (!controller) return;

    controller.dispose();

    const lastDot = path.lastIndexOf('.');
    if (lastDot === -1) return;

    const parentPath = path.substring(0, lastDot);

    const isEmpty = !Object.keys(controllers).some((k) =>
      k.startsWith(parentPath + '.')
    );

    if (isEmpty) {
      const segments = parentPath.split('.');
      const key = segments.pop()!;
      const parentObj = segments.reduce(
        (acc, key) => acc[key] as Record<string, unknown>,
        state
      );
      delete parentObj[key];
      trigger(store, parentPath);

      remove(parentPath);
    }
  };

  const dispose = () => {
    activeEffects.forEach((unSub) => unSub());
    activeEffects.clear();

    Object.keys(controllers).forEach(remove);

    for (const key in state) {
      if (!(RESERVED_KEYS as readonly string[]).includes(key)) {
        delete state[key];
        trigger(store, key);
      }
    }
    guiInstance?.dispose();
  };

  Object.defineProperties(state, {
    _tree: { value: tree, enumerable: false },
    _controllers: { value: controllers, enumerable: false },
    effect: { value: boundEffect, enumerable: false },
    visibility: { value: visibility, enumerable: false },
    remove: { value: remove, enumerable: false },
    dispose: { value: dispose, enumerable: false },
  });

  const proxy = createStateProxy(state, controllers, store);
  const controls = proxy as LevaStore;

  build(tree, state, controllers, store);

  if (options?.gui !== false) {
    guiInstance = mountDOM(controls, options);
  }

  return controls as unknown as Omit<LevaStore, '_tree' | '_controllers'> &
    ExtractValues<T>;
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

    const oldController = controllers[pathString];

    if (oldController) {
      oldController.dispose();
    }

    const controller = (controllers[pathString] = createController(
      pathString,
      state,
      key,
      node,
      store
    ));

    controller.onDispose(() => {
      delete controllers[pathString];
      delete state[key];
      trigger(store, pathString);
    });
  }
}
