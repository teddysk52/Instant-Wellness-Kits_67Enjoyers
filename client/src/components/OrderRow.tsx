import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Order } from "../api/types";
import { formatCurrency, formatPercent, formatDate } from "../utils/format";

interface Props {
  order: Order;
}

export default function OrderRow({ order }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-b border-gray-100 transition-colors hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="whitespace-nowrap px-4 py-3 text-sm">
          <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
            {order.originalId ?? order.id.slice(0, 8)}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
          <span className="font-mono text-xs">
            {order.latitude.toFixed(4)}, {order.longitude.toFixed(4)}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
          {order.jurisdictions?.county || "—"}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
          {formatCurrency(order.subtotal)}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm">
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {formatPercent(order.compositeTaxRate)}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
          {formatCurrency(order.taxAmount)}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">
          {formatCurrency(order.totalAmount)}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
          {formatDate(order.timestamp)}
        </td>
        <td className="px-4 py-3 text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 text-gray-400 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50/50">
          <td colSpan={9} className="px-4 py-4">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {t("orders.jurisdictions")}
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t("orders.state")}</span>
                    <span className="font-medium">
                      {order.jurisdictions?.state || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t("orders.county")}</span>
                    <span className="font-medium">
                      {order.jurisdictions?.county || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t("orders.city")}</span>
                    <span className="font-medium">
                      {order.jurisdictions?.city || "—"}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {t("orders.breakdown")}
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {t("orders.stateRate")}
                    </span>
                    <span className="font-medium">
                      {formatPercent(order.breakdown?.stateRate ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {t("orders.countyRate")}
                    </span>
                    <span className="font-medium">
                      {formatPercent(order.breakdown?.countyRate ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {t("orders.cityRate")}
                    </span>
                    <span className="font-medium">
                      {formatPercent(order.breakdown?.cityRate ?? 0)}
                    </span>
                  </div>
                  {order.breakdown?.specialRates?.map((s, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-500">{s.name}</span>
                      <span className="font-medium">
                        {formatPercent(s.rate)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-gray-200 pt-1.5 text-sm">
                    <span className="font-semibold text-gray-700">
                      {t("orders.compositeRate")}
                    </span>
                    <span className="font-bold text-brand-700">
                      {formatPercent(order.compositeTaxRate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
