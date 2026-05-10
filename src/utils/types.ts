export type ColorValue =
  | string
  | { r: number; g: number; b: number; a?: number }
  | { h: number; s: number; l: number; a?: number }
  | number[];
