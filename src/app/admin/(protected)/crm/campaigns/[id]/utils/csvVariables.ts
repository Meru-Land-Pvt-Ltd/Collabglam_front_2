export type CsvVariableColumn = {
  header?: string;
  variableKey?: string;
  selectedType?: string;
};

const standardVariableByType: Record<string, string> = {
  first_name: "firstName",
  last_name: "lastName",
  full_name: "fullName",
  email: "email",
  company_name: "companyName",
  job_title: "jobTitle",
  website: "website",
  phone: "phone",
  linkedin_url: "linkedinUrl",
};

export function normalizeCustomVariableKey(value = "") {
  return String(value || "")
    .replace(/[{}]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join("");
}

function cleanTemplateVariableKey(value = "") {
  return String(value || "")
    .replace(/[{}]/g, "")
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "");
}

export function getCsvVariableKeyForColumn(column: CsvVariableColumn | null | undefined) {
  const selectedType = String(column?.selectedType || "").trim().toLowerCase();

  if (!selectedType || selectedType === "ignore") return "";

  if (selectedType === "custom") {
    return normalizeCustomVariableKey(column?.variableKey || column?.header || "");
  }

  return standardVariableByType[selectedType] || "";
}

export function toTemplateVariable(value = "") {
  const key = cleanTemplateVariableKey(value);
  return key ? `{{${key}}}` : "";
}

export function getCsvTemplateVariableForColumn(column: CsvVariableColumn | null | undefined) {
  return toTemplateVariable(getCsvVariableKeyForColumn(column));
}

export function buildCsvTemplateVariables(columns: CsvVariableColumn[] = []) {
  const unique = new Set<string>();

  for (const column of columns || []) {
    const variable = getCsvTemplateVariableForColumn(column);
    if (variable) unique.add(variable);
  }

  return Array.from(unique);
}
