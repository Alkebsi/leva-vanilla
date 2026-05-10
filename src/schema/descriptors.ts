import type { ColorValue } from '../utils/types';

/* ---------------------------------- */
/* Shared Types                       */
/* ---------------------------------- */

export type RawInputValue = number | string | boolean | ColorValue;

export type SelectOptions = string[] | Record<string, string | number>;

/* ---------------------------------- */
/* Base Descriptor                    */
/* ---------------------------------- */

type BaseDescriptor<T> = {
  value: T;
  label?: string;
  $?: FolderSettings | boolean;
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

export type ColorDescriptor = BaseDescriptor<ColorValue>;

export type SelectDescriptor = {
  value?: string | number;
  options: SelectOptions;
  label?: string;
  $?: FolderSettings | boolean;
};

export type ButtonDescriptor = {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  $?: FolderSettings | boolean;
};

export type FolderSettings = {
  label?: string;
  collapsed?: boolean;
};

/* ---------------------------------- */
/* Input Schema                       */
/* ---------------------------------- */

export type Input =
  | RawInputValue
  | NumberDescriptor
  | BooleanDescriptor
  | StringDescriptor
  | ColorDescriptor
  | SelectDescriptor
  | ButtonDescriptor
  | (InputSchema & { $?: FolderSettings | boolean });

export type InputSchema = {
  [key: string]: Input;
};
