/** GPTA-style: solid hex or CSS gradient string for full-screen stages */
export function surfaceBackgroundStyle(value, fallback = "#06080a") {
  if (!value || typeof value !== "string") return { backgroundColor: fallback };
  const v = value.trim();
  if (/gradient|linear|radial/i.test(v)) return { background: v };
  return { backgroundColor: v };
}
