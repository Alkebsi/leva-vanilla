/**
 * Return the number of significant decimal places in a step value.
 * Examples:
 * - 0.1 -> 1
 * - 0.20 -> 1 (trailing zeros ignored)
 * - 1e-7 -> 7
 */
const decimalsForStep = (s: number) => {
  if (!isFinite(s) || s === 0) return 0;
  const str = String(s);
  const expMatch = str.match(/e-(\d+)$/);
  if (expMatch) return parseInt(expMatch[1], 10);
  if (str.indexOf('.') >= 0) return str.split('.')[1].replace(/0+$/, '').length;
  return 0;
};

/**
 * Decide how many decimals to show in a numeric input for readability.
 * - if step is in (0,1) and has exactly 1 significant decimal -> 1 decimal
 * - else if value < 0 -> 1 decimal
 * - otherwise -> 2 decimals
 */
export const displayDecimals = (v: number, s: number) => {
  const stepDecimals = decimalsForStep(s);
  if (s > 0 && s < 1 && stepDecimals === 1) return 1;
  return v < 0 ? 1 : 2;
};
