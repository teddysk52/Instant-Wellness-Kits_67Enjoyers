import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useStats } from "../hooks/useOrders";
import { formatCurrency, formatPercent } from "../utils/format";
import Skeleton from "../components/Skeleton";

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/5 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
            {label}
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-gray-900">
            {value}
          </p>
          {sub && (
            <p className="text-xs text-gray-400 font-medium">{sub}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors duration-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniBar({
  data,
}: {
  data: { name: string; value: number; pct: number }[];
}) {
  const colors = [
    "bg-brand-500",
    "bg-brand-400",
    "bg-brand-300",
    "bg-emerald-400",
    "bg-amber-400",
  ];
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
      {data.map((d, i) => (
        <div
          key={d.name}
          className={`${colors[i % colors.length]} transition-all duration-500`}
          style={{ width: `${d.pct}%` }}
          title={`${d.name}: ${d.value.toLocaleString()}`}
        />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data: stats, isLoading, isError } = useStats();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-4 h-8 w-28" />
              <Skeleton className="mt-3 h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("dashboard.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">{t("dashboard.noData")}</p>
          <Link to="/import" className="btn-primary mt-6 inline-block">
            {t("nav.import")}
          </Link>
        </div>
      </div>
    );
  }

  const s = stats.summary;
  const total = stats.subtotalDistribution.reduce((a, b) => a + b.count, 0) || 1;
  const distData = stats.subtotalDistribution
    .sort((a, b) => {
      const order = ["0-25", "25-50", "50-100", "100-150", "150+"];
      return order.indexOf(a.bucket) - order.indexOf(b.bucket);
    })
    .map((d) => ({
      name: `$${d.bucket}`,
      value: d.count,
      pct: (d.count / total) * 100,
    }));

  const top5 = stats.topJurisdictions.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("dashboard.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            {t("nav.orders")}
          </Link>
          <Link
            to="/import"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {t("nav.import")}
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("dashboard.totalOrders")}
          value={s.totalOrders.toLocaleString()}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          }
        />
        <StatCard
          label={t("dashboard.totalRevenue")}
          value={formatCurrency(s.totalRevenue ?? 0)}
          sub={`${t("dashboard.avgOrder")}: ${formatCurrency(s.avgSubtotal ?? 0)}`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label={t("dashboard.totalTax")}
          value={formatCurrency(s.totalTax ?? 0)}
          sub={`${t("dashboard.totalSubtotal")}: ${formatCurrency(s.totalSubtotal ?? 0)}`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          }
        />
        <StatCard
          label={t("dashboard.avgRate")}
          value={formatPercent(s.avgTaxRate ?? 0)}
          sub={`${formatPercent(s.minTaxRate ?? 0)} — ${formatPercent(s.maxTaxRate ?? 0)}`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
          }
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Subtotal distribution */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h3 className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-5">
            {t("dashboard.subtotalDist")}
          </h3>
          <MiniBar data={distData} />
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {distData.map((d, i) => {
              const dots = [
                "bg-brand-500",
                "bg-brand-400",
                "bg-brand-300",
                "bg-emerald-400",
                "bg-amber-400",
              ];
              return (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className={`inline-block h-2 w-2 rounded-full ${dots[i % dots.length]}`} />
                  <span className="font-medium text-gray-700">{d.name}</span>
                  <span className="text-gray-400">{d.value.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 counties */}
        {top5.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h3 className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-5">
              {t("dashboard.topCounties")}
            </h3>
            <div className="space-y-3.5">
              {top5.map((j, i) => {
                const maxCount = top5[0]?.order_count || 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-gray-300">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {j.county || "Unknown"}
                        </span>
                        <span className="text-xs tabular-nums text-gray-400 ml-2">
                          {j.order_count.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-50">
                        <div
                          className="h-full rounded-full bg-brand-500/70 transition-all duration-500"
                          style={{
                            width: `${(j.order_count / maxCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
