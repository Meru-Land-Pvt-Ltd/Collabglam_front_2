export type CsvVariableColumn = {
  header?: string;
  variableKey?: string;
  selectedType?: string;
};

function normalizeVariableKey(value = "") {
  return String(value || "")
    .replace(/[{}]/g, "")
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "");
}

export function toTemplateVariable(value = "") {
  const key = normalizeVariableKey(value);
  return key ? `{{${key}}}` : "";
}

export function buildCsvTemplateVariables(columns: CsvVariableColumn[] = []) {
  const unique = new Set<string>();

  for (const column of columns || []) {
    if (!column) continue;
    if (String(column.selectedType || "").trim().toLowerCase() === "ignore") continue;

    const variable = toTemplateVariable(column.variableKey || column.header || "");
    if (variable) unique.add(variable);
  }

  return Array.from(unique);
}
