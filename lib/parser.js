export function extractItems(raw) {
  if (!raw) return [];
  let text = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = text.indexOf("[");
  if (start >= 0) text = text.slice(start);
  const items = [];
  let depth = 0, objStart = -1, inStr = false, esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === "{") { if (depth === 0) objStart = i; depth++; }
    else if (c === "}") {
      depth--;
      if (depth === 0 && objStart >= 0) {
        try { items.push(JSON.parse(text.slice(objStart, i + 1))); } catch (e) {}
        objStart = -1;
      }
    }
  }
  return items;
}
