import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useOrders } from "../hooks/useOrders";
import type { OrderFilters } from "../api/types";
import OrderRow from "../components/OrderRow";
import OrderFiltersPanel from "../components/OrderFilters";
import Pagination from "../components/Pagination";
import { TableSkeleton } from "../components/Skeleton";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

export default function OrdersPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: 20,
    sortOrder: "desc",
  });
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error, refetch } = useOrders({
    ...filters,
    search: search || undefined,
  });

  const toggleSort = () => {
    setFilters((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "desc" ? "asc" : "desc",
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("orders.title")}
          </h1>
          {data && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
              {data.meta.total.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setFilters((f) => ({ ...f, page: 1 }));
              }}
              placeholder={t("common.search") + "..."}
              className="input-field w-40 pl-8 text-sm"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <OrderFiltersPanel filters={filters} onApply={setFilters} />
          <Link to="/create" className="btn-primary">
            + {t("nav.createOrder")}
          </Link>
        </div>
      </div>

      {isLoading && <TableSkeleton rows={8} cols={9} />}

      {isError && (
        <ErrorState error={error as Error} onRetry={() => refetch()} />
      )}

      {data && data.data.length === 0 && (
        <EmptyState
          title={t("orders.emptyTitle")}
          description={t("orders.emptyDescription")}
          action={
            <Link to="/import" className="btn-primary">
              {t("nav.import")}
            </Link>
          }
        />
      )}

      {data && data.data.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t("orders.id")}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t("orders.coordinates")}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t("orders.county")}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t("orders.subtotal")}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t("orders.taxRate")}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t("orders.taxAmount")}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t("orders.total")}
                  </th>
                  <th
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:text-gray-700"
                    onClick={toggleSort}
                  >
                    <span className="inline-flex items-center gap-1">
                      {t("orders.date")}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="h-3.5 w-3.5"
                      >
                        {filters.sortOrder === "desc" ? (
                          <path
                            fillRule="evenodd"
                            d="M8 2a.75.75 0 01.75.75v8.69l2.22-2.22a.75.75 0 011.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 011.06-1.06l2.22 2.22V2.75A.75.75 0 018 2z"
                            clipRule="evenodd"
                          />
                        ) : (
                          <path
                            fillRule="evenodd"
                            d="M8 14a.75.75 0 01-.75-.75V4.56L5.03 6.78a.75.75 0 01-1.06-1.06l3.5-3.5a.75.75 0 011.06 0l3.5 3.5a.75.75 0 01-1.06 1.06L8.75 4.56v8.69A.75.75 0 018 14z"
                            clipRule="evenodd"
                          />
                        )}
                      </svg>
                    </span>
                  </th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            limit={data.meta.limit}
            onPageChange={(page) =>
              setFilters((prev) => ({ ...prev, page }))
            }
          />
        </div>
      )}
    </div>
  );
}
