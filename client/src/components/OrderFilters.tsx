import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { OrderFilters } from "../api/types";

interface Props {
  filters: OrderFilters;
  onApply: (f: OrderFilters) => void;
}

export default function OrderFiltersPanel({ filters, onApply }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<OrderFilters>({ ...filters });

  const update = (key: keyof OrderFilters, value: string) => {
    setLocal((prev) => ({
      ...prev,
      [key]:
        value === ""
          ? undefined
          : isNaN(Number(value))
          ? value
          : Number(value),
    }));
  };

  const apply = () => {
    onApply({ ...local, page: 1 });
    setOpen(false);
  };

  const clear = () => {
    const cleared: OrderFilters = {
      page: 1,
      limit: filters.limit,
      sortOrder: filters.sortOrder,
    };
    setLocal(cleared);
    onApply(cleared);
    setOpen(false);
  };

  const hasFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.subtotalMin !== undefined ||
    filters.subtotalMax !== undefined ||
    filters.taxRateMin !== undefined ||
    filters.taxRateMax !== undefined;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`btn-secondary gap-2 ${
          hasFilters ? "border-brand-300 text-brand-700" : ""
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path
            fillRule="evenodd"
            d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z"
            clipRule="evenodd"
          />
        </svg>
        {t("common.filter")}
        {hasFilters && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
            !
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("orders.filters.dateRange")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={local.dateFrom || ""}
                    onChange={(e) => update("dateFrom", e.target.value)}
                    className="input-field text-xs"
                  />
                  <input
                    type="date"
                    value={local.dateTo || ""}
                    onChange={(e) => update("dateTo", e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("orders.filters.subtotalRange")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={local.subtotalMin ?? ""}
                    onChange={(e) => update("subtotalMin", e.target.value)}
                    className="input-field text-xs"
                    placeholder={t("orders.filters.subtotalMin")}
                    step="0.01"
                  />
                  <input
                    type="number"
                    value={local.subtotalMax ?? ""}
                    onChange={(e) => update("subtotalMax", e.target.value)}
                    className="input-field text-xs"
                    placeholder={t("orders.filters.subtotalMax")}
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("orders.filters.taxRateRange")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={local.taxRateMin ?? ""}
                    onChange={(e) => update("taxRateMin", e.target.value)}
                    className="input-field text-xs"
                    placeholder={t("orders.filters.taxRateMin")}
                    step="0.001"
                  />
                  <input
                    type="number"
                    value={local.taxRateMax ?? ""}
                    onChange={(e) => update("taxRateMax", e.target.value)}
                    className="input-field text-xs"
                    placeholder={t("orders.filters.taxRateMax")}
                    step="0.001"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={apply} className="btn-primary flex-1 text-xs">
                  {t("orders.filters.apply")}
                </button>
                <button
                  onClick={clear}
                  className="btn-secondary flex-1 text-xs"
                >
                  {t("orders.filters.clear")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
