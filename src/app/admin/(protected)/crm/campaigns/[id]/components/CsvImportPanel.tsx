"use client";

import { CheckCircle2, Eye, Sparkles, Upload } from "lucide-react";
import { getCsvTemplateVariableForColumn, normalizeCustomVariableKey } from "../utils/csvVariables";

type CsvColumnType =
  | "ignore"
  | "first_name"
  | "last_name"
  | "full_name"
  | "email"
  | "company_name"
  | "job_title"
  | "website"
  | "phone"
  | "linkedin_url"
  | "custom";

type CsvPreviewColumn = {
  header: string;
  variableKey: string;
  inferredType: CsvColumnType;
  selectedType: CsvColumnType;
  samples: string[];
};

type CsvPreviewRow = Record<string, string>;

type CsvImportPanelProps = {
  csvFile: File | null;
  csvPreviewColumns: CsvPreviewColumn[];
  csvPreviewFileName: string;
  csvPreviewRows: CsvPreviewRow[];
  csvPreviewTotalRows: number;
  submittingKey: string;
  onPreviewCsv: (file: File) => Promise<void> | void;
  onUpdateColumn: (header: string, patch: Partial<CsvPreviewColumn>) => void;
  onConfirmImport: () => Promise<void> | void;
};

const csvTypeOptions: Array<{ value: CsvColumnType; label: string }> = [
  { value: "ignore", label: "Ignore" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "full_name", label: "Full Name" },
  { value: "email", label: "Email" },
  { value: "company_name", label: "Company Name" },
  { value: "job_title", label: "Job Title" },
  { value: "website", label: "Website" },
  { value: "phone", label: "Phone" },
  { value: "linkedin_url", label: "LinkedIn URL" },
  { value: "custom", label: "Custom Variable" },
];

export function CsvImportPanel({
  csvFile,
  csvPreviewColumns,
  csvPreviewFileName,
  csvPreviewRows,
  csvPreviewTotalRows,
  submittingKey,
  onPreviewCsv,
  onUpdateColumn,
  onConfirmImport,
}: CsvImportPanelProps) {
  return (
    <div className="flex-1 overflow-auto px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Upload CSV
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Upload your CSV file, verify column mappings, and import leads into the campaign.
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                CSV Mapping Import
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Preview the file, map every column, then import.
              </p>
            </div>

            {csvPreviewFileName ? (
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                File processed
              </span>
            ) : null}
          </div>

          <div className="space-y-5">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center transition hover:border-blue-300 hover:bg-blue-50">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <Upload className="h-7 w-7" />
              </div>

              <div>
                <p className="text-base font-semibold text-slate-800">
                  {csvFile ? csvFile.name : "Choose a CSV file"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Drop a file here or click to browse
                </p>
              </div>

              <input
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) await onPreviewCsv(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>

            {csvPreviewColumns.length > 0 ? (
              <>
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {csvPreviewFileName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {csvPreviewTotalRows} rows detected
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                        <Sparkles className="h-3.5 w-3.5" />
                        Variables auto-generated from this CSV
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[520px] overflow-auto">
                    <table className="min-w-full text-left">
                      <thead className="sticky top-0 z-10 bg-white">
                        <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          <th className="px-5 py-3">CSV Column</th>
                          <th className="px-5 py-3">Mapped As</th>
                          <th className="px-5 py-3">Variable</th>
                          <th className="px-5 py-3">Samples</th>
                        </tr>
                      </thead>

                      <tbody>
                        {csvPreviewColumns.map((column) => (
                          <tr
                            key={column.header}
                            className="border-b border-slate-100 last:border-b-0"
                          >
                            <td className="px-5 py-4 align-top">
                              <p className="text-sm font-semibold text-slate-900">
                                {column.header}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Inferred: {column.inferredType || "custom"}
                              </p>
                            </td>

                            <td className="px-5 py-4 align-top">
                              <select
                                value={column.selectedType}
                                onChange={(event) => {
                                  const selectedType = event.target.value as CsvColumnType;
                                  onUpdateColumn(column.header, {
                                    selectedType,
                                    variableKey:
                                      selectedType === "custom"
                                        ? normalizeCustomVariableKey(column.variableKey || column.header)
                                        : column.variableKey,
                                  });
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                              >
                                {csvTypeOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-5 py-4 align-top">
                              <input
                                value={
                                  column.selectedType === "custom"
                                    ? column.variableKey
                                    : getCsvTemplateVariableForColumn(column).replace(/[{}]/g, "")
                                }
                                disabled={column.selectedType !== "custom"}
                                onChange={(event) =>
                                  onUpdateColumn(column.header, {
                                    variableKey: normalizeCustomVariableKey(event.target.value),
                                  })
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                              />

                              <p className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                {getCsvTemplateVariableForColumn(column) || "Ignored"}
                              </p>
                            </td>

                            <td className="px-5 py-4 align-top">
                              <div className="space-y-1">
                                {(column.samples || []).map((sample, index) => (
                                  <p key={index} className="text-sm text-slate-600">
                                    {sample}
                                  </p>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                      Review all column mappings before importing.
                    </p>

                    <button
                      type="button"
                      onClick={onConfirmImport}
                      disabled={submittingKey !== ""}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4" />
                      {submittingKey === "csv-import" ? "Importing..." : "Import with Mapping"}
                    </button>
                  </div>
                </div>

                {csvPreviewRows.length > 0 ? (
                  <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            CSV Row Preview
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Showing first {csvPreviewRows.length} rows from the uploaded file
                          </p>
                        </div>

                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                          <Eye className="h-3.5 w-3.5" />
                          Raw CSV preview
                        </span>
                      </div>
                    </div>

                    <div className="max-h-[420px] overflow-auto">
                      <table className="min-w-full text-left">
                        <thead className="sticky top-0 z-10 bg-white">
                          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {csvPreviewColumns.map((column) => (
                              <th key={column.header} className="px-5 py-3 whitespace-nowrap">
                                {column.header}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {csvPreviewRows.map((row, rowIndex) => (
                            <tr
                              key={`csv-row-${rowIndex}`}
                              className="border-b border-slate-100 last:border-b-0"
                            >
                              {csvPreviewColumns.map((column) => (
                                <td
                                  key={`${rowIndex}-${column.header}`}
                                  className="px-5 py-3 align-top text-sm text-slate-700"
                                >
                                  {String(row?.[column.header] ?? "—")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-12 text-center">
                <p className="text-base font-semibold text-slate-800">
                  Upload a CSV to preview mappings
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Every imported CSV header becomes an available sequence variable.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export default CsvImportPanel;
