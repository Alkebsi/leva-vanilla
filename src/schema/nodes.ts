import type { ColorValue } from '../core/types';

type BaseNode<T, K extends string> = {
  key: string;
  type: K;
  value: T;
  label: string;
};

export type NumberNode = BaseNode<number, 'number'> & {
  min?: number;
  max?: number;
  step?: number;
};

export type BooleanNode = BaseNode<boolean, 'boolean'>;

export type StringNode = BaseNode<string, 'string'>;

export type ColorNode = BaseNode<ColorValue, 'color'>;

export type SelectOption = {
  label: string;
  value: string | number;
};

export type SelectNode = BaseNode<string | number, 'select'> & {
  options: SelectOption[];
};

export type ButtonNode = {
  key: string;
  type: 'button';
  trigger: () => void;
  label: string;
  disabled?: boolean;
};

export type FolderNode = {
  key: string;
  type: 'folder';
  children: Record<string, Node>;
};

export type Node =
  | NumberNode
  | BooleanNode
  | StringNode
  | ColorNode
  | SelectNode
  | ButtonNode
  | FolderNode;

export type NodeMap = {
  [K in keyof Node]: {
    type: K;
    value: Node[K] extends { value: infer V } ? V : never;
  };
};
