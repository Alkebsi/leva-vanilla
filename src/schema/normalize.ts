import type { Node, SelectOption } from './nodes';
import type {
  ButtonDescriptor,
  InputSchema,
  RawInputValue,
} from './descriptors';
import { isColor } from '../utils/color';

/* ---------------------------------- */
/* Descriptor Whitelist               */
/* ---------------------------------- */

const BASE_DESCRIPTOR_KEYS = new Set(['value', 'label']);

const NUMBER_DESCRIPTOR_KEYS = new Set([
  ...BASE_DESCRIPTOR_KEYS,
  'min',
  'max',
  'step',
]);

const BOOLEAN_DESCRIPTOR_KEYS = new Set([...BASE_DESCRIPTOR_KEYS]);

const STRING_DESCRIPTOR_KEYS = new Set([...BASE_DESCRIPTOR_KEYS]);

const SELECT_DESCRIPTOR_KEYS = new Set([...BASE_DESCRIPTOR_KEYS, 'options']);

/* ---------------------------------- */
/* Normalize Entry                    */
/* ---------------------------------- */

const normalize = (schema: InputSchema): Record<string, Node> => {
  const result: Record<string, Node> = {};

  for (const key in schema) {
    const input = schema[key];

    if (Array.isArray(input)) {
      throw new Error(
        `Invalid schema at "${key}": arrays are not supported directly. Use { options: [...] }`
      );
    }

    // 1. function shorthand
    if (typeof input === 'function') {
      result[key] = {
        key,
        type: 'button',
        trigger: input,
        label: key,
      };
      continue;
    }

    // 2. button descriptor
    if (isButtonDescriptor(input)) {
      result[key] = {
        key,
        type: 'button',
        trigger: input.onClick,
        label: input.label || key,
        disabled: input.disabled,
      };
      continue;
    }

    // 3. Color detection (check objects/strings for color signatures)
    if (isColor(input)) {
      result[key] = normalizeValue(key, { value: input });
      continue;
    }

    // 4. primitive → wrap
    if (typeof input !== 'object' || input === null) {
      result[key] = normalizeValue(key, { value: input });
      continue;
    }

    // 5. descriptor
    if (isDescriptor(input)) {
      result[key] = normalizeValue(key, input);
      continue;
    }

    // 6. folder
    if (isFolder(input)) {
      result[key] = {
        key,
        type: 'folder',
        children: normalize(input),
      };
      continue;
    }
  }

  return result;
};

/* ---------------------------------- */
/* Helpers                            */
/* ---------------------------------- */

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function normalizeSelectOptions(
  input: string[] | Record<string, string | number>
): SelectOption[] {
  if (Array.isArray(input)) {
    return input.map((v) => ({
      label: String(v),
      value: v,
    }));
  }

  return Object.entries(input).map(([label, value]) => ({
    label,
    value,
  }));
}

function isDescriptor(
  input: unknown
): input is { value: RawInputValue } & Record<string, unknown> {
  return (
    typeof input === 'object' &&
    input !== null &&
    ('value' in input || 'options' in input)
  );
}

function isButtonDescriptor(input: unknown): input is ButtonDescriptor {
  if (typeof input !== 'object' || input === null) return false;
  const obj = input as Record<string, unknown>;
  return typeof obj.onClick === 'function';
}

function isFolder(input: unknown): input is InputSchema {
  if (!isPlainObject(input)) return false;

  return Object.values(input).every(
    (v) => isPlainObject(v) || typeof v !== 'object' || isDescriptor(v)
  );
}

/* ---------------------------------- */
/* STRICT VALIDATION LAYER            */
/* ---------------------------------- */

function assertNoUnknownKeys(
  key: string,
  input: Record<string, unknown>,
  allowed: Set<string>
) {
  for (const k in input) {
    if (!allowed.has(k)) {
      throw new Error(
        `[leva] Invalid property "${k}" in "${key}". This field is not allowed for this control type.`
      );
    }
  }
}

/* ---------------------------------- */
/* Core Normalization                 */
/* ---------------------------------- */

function normalizeValue(
  key: string,
  input: { value?: RawInputValue } & Record<string, unknown>
): Node {
  const label = typeof input.label === 'string' ? input.label : key;

  if ('options' in input) {
    assertNoUnknownKeys(key, input, SELECT_DESCRIPTOR_KEYS);

    const options = normalizeSelectOptions(
      input.options as string[] | Record<string, string | number>
    );

    let value: string | number;

    if (input.value !== undefined) {
      if (typeof input.value !== 'string' && typeof input.value !== 'number') {
        throw new Error(
          `[leva] Invalid select value type for "${key}". Expected string or number.`
        );
      }

      value = input.value;
    } else {
      value = options[0]?.value;
    }

    const isValid = (v: string | number) => options.some((o) => o.value === v);

    if (!isValid(value)) {
      throw new Error(
        `[leva] Invalid initial value "${value}" for "${key}". Must be one of: ${options
          .map((o) => o.value)
          .join(', ')}`
      );
    }

    return {
      key,
      type: 'select',
      value,
      options,
      label,
    };
  }

  const v = input.value;

  // number
  if (typeof v === 'number') {
    assertNoUnknownKeys(key, input, NUMBER_DESCRIPTOR_KEYS);

    return {
      key,
      type: 'number',
      value: v,
      label,
      min: typeof input.min === 'number' ? input.min : undefined,
      max: typeof input.max === 'number' ? input.max : undefined,
      step: typeof input.step === 'number' ? input.step : undefined,
    };
  }

  // boolean
  if (typeof v === 'boolean') {
    assertNoUnknownKeys(key, input, BOOLEAN_DESCRIPTOR_KEYS);

    return {
      key,
      type: 'boolean',
      value: v,
      label,
    };
  }

  // string → color or text
  if (typeof v === 'string') {
    assertNoUnknownKeys(key, input, STRING_DESCRIPTOR_KEYS);

    if (isColor(v)) {
      return {
        key,
        type: 'color',
        value: v,
        label,
      };
    }

    return {
      key,
      type: 'string',
      value: v,
      label,
    };
  }

  // object or array colors
  if (isColor(v)) {
    return {
      key,
      type: 'color',
      value: v,
      label,
    };
  }

  throw new Error(`Unsupported value for key "${key}"`);
}

export default normalize;
