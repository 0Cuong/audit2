import path from 'node:path';

const FILTER_OPERATORS = new Set(["eq","neq","gt","gte","lt","lte","in","is","contains"]);

export function validateMutationFilters(filters, columns, action) {
  if (!Array.isArray(filters) || filters.length === 0) {
    throw new Error(`Refusing ${action} without a filter`);
  }
  validateFilters(filters, columns);
  return filters;
}

export function validateFilters(filters, columns) {
  if (!Array.isArray(filters)) {
    if (filters == null) return [];
    throw new Error("Invalid filters");
  }

  const allowedColumns = new Set(columns);
  for (const filter of filters) {
    if (!filter || typeof filter !== "object" || typeof filter.column !== "string") {
      throw new Error("Invalid filter");
    }
    if (!allowedColumns.has(filter.column)) {
      throw new Error("Invalid filter column: " + filter.column);
    }
    const op = filter.op || "eq";
    if (!FILTER_OPERATORS.has(op)) {
      throw new Error("Unsupported filter operator: " + op);
    }
    if (op === "in" && (!Array.isArray(filter.value) || filter.value.length === 0)) {
      throw new Error("Invalid IN filter");
    }
    if (op === "contains" && !Array.isArray(filter.value)) {
      throw new Error("Invalid contains filter");
    }
  }
  return filters;
}

export function matchRow(row, filters) {
  return filters.every((filter) => {
    const value = row[filter.column];
    switch (filter.op || "eq") {
      case "eq": return value === filter.value;
      case "neq": return value !== filter.value;
      case "gt": return value > filter.value;
      case "gte": return value >= filter.value;
      case "lt": return value < filter.value;
      case "lte": return value <= filter.value;
      case "in": return filter.value.includes(value);
      case "is": return filter.value === null ? value == null : value === filter.value;
      case "contains":
        return Array.isArray(value)
          ? filter.value.every((item) => value.includes(item))
          : String(value ?? "").includes(String(filter.value ?? ""));
      default:
        throw new Error("Unsupported filter operator: " + filter.op);
    }
  });
}

export function resolveContainedPath(root, relativePath) {
  const rootPath = path.resolve(root);
  const candidate = path.resolve(rootPath, relativePath);
  const relative = path.relative(rootPath, candidate);
  if (relative === "" || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) {
    throw new Error("Path escapes recovery root");
  }
  return candidate;
}
