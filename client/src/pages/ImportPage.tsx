import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useImportOrders } from "../hooks/useOrders";
import type { ImportResult } from "../api/types";

export default function ImportPage() {
  const { t } = useTranslation();
  const mutation = useImportOrders();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.name.endsWith(".csv")) {
      setFile(dropped);
      setResult(null);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    mutation.mutate(file, { onSuccess: (data) => setResult(data) });
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    mutation.reset();
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-2xl flex-col justify-center space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {t("import.title")}
      </h1>

      {!result && (
        <div className="card space-y-5 p-6">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
              dragActive
                ? "border-brand-400 bg-brand-50"
                : file
                ? "border-green-300 bg-green-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-6 w-6 text-green-600"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-medium text-gray-900">
                  {file.name}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-6 w-6 text-gray-400"
                  >
                    <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-medium text-gray-900">
                  {dragActive
                    ? t("import.dropzoneActive")
                    : t("import.dropzone")}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  CSV
                </p>
              </>
            )}
          </div>

          {mutation.isError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {(mutation.error as Error).message}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || mutation.isPending}
            className="btn-primary w-full"
          >
            {mutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {t("import.uploading")}
              </span>
            ) : (
              t("import.upload")
            )}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="border-b border-gray-200 bg-gradient-to-r from-brand-50 to-blue-50 px-5 py-4">
              <p className="text-sm font-medium text-gray-800">
                {result.message}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {result.total.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {t("import.totalRows")}
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {result.processed.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {t("import.successful")}
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                {result.failed.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {t("import.failed")}
              </p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="card overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50/80 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  {t("import.errorDetails")} ({result.errors.length})
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50">
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                        {t("import.row")}
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                        {t("import.errorDetail")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e) => (
                      <tr
                        key={e.row}
                        className="border-b border-gray-100"
                      >
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {e.row}
                        </td>
                        <td className="px-4 py-2 text-sm text-red-600">
                          {e.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button onClick={resetForm} className="btn-secondary w-full">
            {t("import.importAnother")}
          </button>
        </div>
      )}
    </div>
  );
}
