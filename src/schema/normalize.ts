import type { Node, SelectOption } from './nodes';
import type {
  ButtonDescriptor,
  FolderSettings,
  InputSchema,
  RawInputValue,
  SelectOptions,
} from './descriptors';
import type { ColorValue } from '../utils/types';
import { isColor } from '../utils/color';

/* ---------------------------------- */
/* Descriptor Whitelist               */
/* ---------------------------------- */

const BASE_DESCRIPTOR_KEYS = new Set(['value', 'label', 'visible']);

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

type FolderInput = {
  $?: FolderSettings | boolean;
  label?: string;
  collapsed?: boolean;
} & InputSchema;

const normalize = (schema: InputSchema): Record<string, Node> => {
  const result: Record<string, Node> = {};

  for (const key in schema) {
    const input = schema[key];

    // 0. Forced folder check ($)
    if (isPlainObject(input) && '$' in input) {
      const { $, label, collapsed, ...children } = input as FolderInput;
      const settings = isPlainObject($) ? $ : {};

      result[key] = {
        key,
        type: 'folder',
        label: settings.label || (typeof label === 'string' ? label : key),
        collapsed:
          settings.collapsed ??
          (typeof collapsed === 'boolean' ? collapsed : undefined),
        children: normalize(children as InputSchema),
      };
      continue;
    }

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
        visible: true,
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
        visible: input.visible ?? true,
        disabled: input.disabled,
      };
      continue;
    }

    // 3. Color detection (check objects/strings for color signatures)
    if (isColor(input)) {
      result[key] = normalizeValue(key, { value: input as RawInputValue });
      continue;
    }

    // 4. primitive → wrap
    if (typeof input !== 'object' || input === null) {
      result[key] = normalizeValue(key, { value: input as RawInputValue });
      continue;
    }

    // 5. descriptor
    if (isDescriptor(input)) {
      result[key] = normalizeValue(key, input);
      continue;
    }

    // 6. implicit folder
    if (isPlainObject(input)) {
      const { label, collapsed, ...children } = input as FolderInput;

      result[key] = {
        key,
        type: 'folder',
        label: typeof label === 'string' ? label : key,
        collapsed: typeof collapsed === 'boolean' ? collapsed : undefined,
        children: normalize(children as InputSchema),
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
): input is
  | { value: RawInputValue; label?: string }
  | { options: unknown; value?: RawInputValue; label?: string } {
  return isPlainObject(input) && ('value' in input || 'options' in input);
}

function isButtonDescriptor(input: unknown): input is ButtonDescriptor {
  return (
    isPlainObject(input) &&
    typeof (input as Record<string, unknown>).onClick === 'function'
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
  const visible = typeof input.visible === 'boolean' ? input.visible : true;

  // select
  if ('options' in input) {
    assertNoUnknownKeys(key, input, SELECT_DESCRIPTOR_KEYS);

    const options = normalizeSelectOptions(input.options as SelectOptions);

    let value: string | number | undefined;

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

    const isValid = (v: unknown): v is string | number =>
      (typeof v === 'string' || typeof v === 'number') &&
      options.some((o) => o.value === v);

    if (!isValid(value)) {
      throw new Error(
        `[leva] Invalid initial value "${value}" for "${key}". Must be one of: ${options
          .map((o) => String(o.value))
          .join(', ')}`
      );
    }

    return {
      key,
      type: 'select',
      value,
      options,
      label,
      visible,
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
      visible,
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
      visible,
    };
  }

  // string → color or text
  if (typeof v === 'string') {
    assertNoUnknownKeys(key, input, STRING_DESCRIPTOR_KEYS);

    if (isColor(v)) {
      return {
        key,
        type: 'color',
        value: v as ColorValue,
        label,
        visible,
      };
    }

    return {
      key,
      type: 'string',
      value: v,
      label,
      visible,
    };
  }

  // object or array colors
  if (isColor(v)) {
    return {
      key,
      type: 'color',
      value: v as ColorValue,
      label,
      visible,
    };
  }

  throw new Error(`Unsupported value for key "${key}"`);
}

export default normalize;
