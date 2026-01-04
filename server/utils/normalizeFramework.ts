export function normalizeFrameworkName(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[\._-]+/g, "")
    .trim();
}

// Optional alias grouping
export function normalizeFrameworkAlias(name: string) {
  const key = normalizeFrameworkName(name);

  if (["node", "nodejs"].includes(key)) return "node";
  if (["express", "expressjs"].includes(key)) return "express";
  if (["nextjs"].includes(key)) return "nextjs";
  if (["mongodb", "mongo"].includes(key)) return "mongodb";

  return key;
}
