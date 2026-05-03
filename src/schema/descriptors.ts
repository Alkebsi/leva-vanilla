/* ---------------------------------- */
/* Shared Types                       */
/* ---------------------------------- */

type Primitive = number | string | boolean;

export type SelectOptions = string[] | Record<string, string | number>;

/* ---------------------------------- */
/* Base Descriptor                    */
/* ---------------------------------- */

type BaseDescriptor<T> = {
  value?: T;
  label?: string;
};

/* ---------------------------------- */
/* Specific Descriptors               */
/* ---------------------------------- */

export type NumberDescriptor = BaseDescriptor<number> & {
  min?: number;
  max?: number;
  step?: number;
};

export type BooleanDescriptor = BaseDescriptor<boolean>;

export type StringDescriptor = BaseDescriptor<string>;

export type ColorDescriptor = BaseDescriptor<string>;

export type SelectDescriptor = BaseDescriptor<string | number> & {
  options: SelectOptions;
};

export type ButtonDescriptor = {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
};

/* ---------------------------------- */
/* Input Schema                       */
/* ---------------------------------- */

export type Input =
  | Primitive
  | NumberDescriptor
  | BooleanDescriptor
  | StringDescriptor
  | ColorDescriptor
  | SelectDescriptor
  | ButtonDescriptor
  | InputSchema; // folder

export type InputSchema = {
  [key: string]: Input;
};

/* ---------------------------------- */
/* Raw Value (for normalize)          */
/* ---------------------------------- */

export type RawInputValue = number | string | boolean;
