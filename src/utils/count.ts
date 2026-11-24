// why: Number('') and Number(null) are both 0, so an absent header has to fail before it is parsed.
export const count = (value: string | null): number | null => {
  if (value === null || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
