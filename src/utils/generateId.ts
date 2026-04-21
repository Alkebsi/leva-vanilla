export const generateId = (prefix: string = 'leva'): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);

  return `${prefix}-${timestamp}-${randomPart}`;
};
