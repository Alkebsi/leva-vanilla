import type { Node } from '../schema/nodes';
import type { FolderSettings } from '../schema/descriptors';
import type { ColorValue } from '../utils/types';
/* ---------------------------------- */
/* Internal Reactivity Types          */
/* ---------------------------------- */
type Dep = Set<Effect>;

export interface ReactiveStore {
  depsMap: Map<string, Dep>;
  activeEffect: Effect | null;
  effectStack: Effect[];
}

export type Effect = {
  run: () => void;
  deps: Dep[];
};

/* ---------------------------------- */
/* Base Controller Definitions        */
/* ---------------------------------- */
export type BaseController<Type extends string> = {
  key: string;
  type: Type;
};

export type ValueController<T, Type extends string> = BaseController<Type> & {
  value: T;
  set: (v: T) => void;
  onChange: (fn: (v: T) => void) => () => void;
  label: string;
  dispose: () => void;
  onDispose: (fn: () => void) => void;
};

/* ---------------------------------- */
/* Specific Controller Types          */
/* ---------------------------------- */
export type StringController = ValueController<string, 'string'>;

export type NumberController = ValueController<number, 'number'> & {
  min?: number;
  max?: number;
  step?: number;
};

export type BooleanController = ValueController<boolean, 'boolean'>;

export type ColorController = ValueController<ColorValue, 'color'>;

export type SelectController = ValueController<string | number, 'select'> & {
  options: { label: string; value: string | number }[];
};

export type DataController =
  | ColorController
  | NumberController
  | BooleanController
  | SelectController;

export type ButtonController = BaseController<'button'> & {
  trigger: () => void;
  label: string;
  disabled?: boolean;
  dispose: () => void;
  onDispose: (fn: () => void) => void;
};

/* ---------------------------------- */
/* Folder Types                       */
/* ---------------------------------- */
/* ---------------------------------- */
/* The Plugin Registry                */
/* ---------------------------------- */
export interface ControlRegistry {
  string: { input: StringInput; value: string; controller: StringController };
  number: { input: NumberInput; value: number; controller: NumberController };
  boolean: {
    input: BooleanInput;
    value: boolean;
    controller: BooleanController;
  };
  color: {
    input: ColorInput;
    value: ColorValue;
    controller: ColorController;
  };
  select: {
    input: SelectInput<SelectOptions>;
    value: string | number;
    controller: SelectController;
  };
  button: { input: ButtonInput; value: never; controller: ButtonController };
}

export type ControlType = keyof ControlRegistry;
export type AnyController = ControlRegistry[ControlType]['controller'];

export type InternalFactory<K extends string, C extends AnyController> = (
  path: string,
  key: string,
  state: Record<string, unknown>,
  node: Extract<Node, { type: K }>,
  store: ReactiveStore
) => C;

/* ---------------------------------- */
/* Input Definitions                  */
/* ---------------------------------- */
type InternalKeys =
  | 'options'
  | 'value'
  | 'onClick'
  | 'trigger'
  | 'min'
  | 'max'
  | 'step'
  | 'label'
  | 'disabled'
  | '$';

export type NumberInput = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  $?: FolderSettings | boolean;
};
export type BooleanInput = {
  value: boolean;
  label?: string;
  $?: FolderSettings | boolean;
};
export type StringInput = {
  value: string;
  label?: string;
  $?: FolderSettings | boolean;
};
export type ColorInput = {
  value: ColorValue;
  label?: string;
  $?: FolderSettings | boolean;
};
export type SelectOptions =
  | readonly (string | number)[]
  | Record<string, string | number>;
export type SelectInput<O extends SelectOptions> = {
  options: O;
  value?: GetSelectValue<O>;
  label?: string;
  $?: FolderSettings | boolean;
};
export type ButtonInput = {
  onClick: (...args: unknown[]) => void;
  label?: string;
  disabled?: boolean;
  $?: FolderSettings | boolean;
};

/* ---------------------------------- */
/* The Type Engine (Maintainable!)    */
/* ---------------------------------- */

export type Schema = Record<string, unknown>;

type GetSelectValue<T> = T extends readonly (infer V)[]
  ? V
  : T extends Record<string, infer V>
    ? V
    : never;

export type ValidateSchema<T> = {
  [K in keyof T]: T[K] extends { options: infer O }
    ? O extends SelectOptions
      ? Strict<SelectInput<O>, T[K]>
      : never
    : T[K] extends { onClick: (...args: unknown[]) => void }
      ? Strict<ButtonInput, T[K]>
      : T[K] extends { value: infer V }
        ? Strict<LookupInput<V>, T[K]>
        : T[K] extends
              | number
              | boolean
              | string
              | ((...args: unknown[]) => void)
          ? T[K]
          : T[K] extends Record<string, unknown>
            ? K extends '$'
              ? StrictFolderSettings<T[K]>
              : ValidateSchema<T[K]>
            : T[K];
};

type StrictFolderSettings<T> = FolderSettings & {
  [K in keyof T]: K extends keyof FolderSettings ? T[K] : never;
};

type LookupInput<V> = {
  [K in keyof ControlRegistry]: V extends ControlRegistry[K]['value']
    ? ControlRegistry[K]['input']
    : never;
}[keyof ControlRegistry];

type Strict<Expected, Actual> = Expected & {
  [K in keyof Actual]: K extends keyof Expected | InternalKeys
    ? Actual[K]
    : never;
};
