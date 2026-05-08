import type { Node } from '../schema/nodes';
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

export type ColorController = ValueController<string, 'color'>;

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
};

/* ---------------------------------- */
/* Folder Types                       */
/* ---------------------------------- */
export type FolderSettings = {
  label?: string;
  collapsed?: boolean;
};

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
  color: { input: ColorInput; value: string; controller: ColorController };
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
  | '$'
  | 'min'
  | 'max'
  | 'step'
  | 'label'
  | 'disabled';

export type NumberInput = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
};
export type BooleanInput = { value: boolean; label?: string };
export type StringInput = { value: string; label?: string };
export type ColorInput = { value: string; label?: string };
export type SelectOptions =
  | readonly (string | number)[]
  | Record<string, string | number>;
export type SelectInput<O extends SelectOptions> = {
  options: O;
  value?: GetSelectValue<O>;
  label?: string;
};
export type ButtonInput = {
  onClick: (...args: unknown[]) => void;
  label?: string;
  disabled?: boolean;
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

export type InferState<T> = {
  [K in keyof T as IsAction<T[K]> extends true
    ? never
    : K extends '$'
      ? never
      : K]: T[K] extends { options: infer O }
    ? GetSelectValue<O>
    : T[K] extends { value: infer V }
      ? V
      : T[K] extends number
        ? number
        : T[K] extends boolean
          ? boolean
          : T[K] extends string
            ? string
            : T[K] extends Record<string, unknown>
              ? InferState<T[K]>
              : T[K];
};

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
              ? FolderSettings
              : ValidateSchema<T[K]>
            : T[K];
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

type IsAction<T> = T extends
  | { onClick: (...args: unknown[]) => void }
  | ((...args: unknown[]) => void)
  ? true
  : false;
