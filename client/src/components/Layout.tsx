import { NavLink, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const isMapPage = location.pathname === "/map";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-brand-50 text-brand-700"
        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
    }`;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-base font-bold text-gray-900 tracking-tight group-hover:text-brand-600 transition-colors">
                IWK Admin
              </span>
              <span className="hidden sm:inline-flex items-center rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600 ring-1 ring-inset ring-brand-100">
                NY
              </span>
            </Link>
            <nav className="hidden items-center gap-0.5 md:flex">
              <NavLink to="/" className={linkClass} end>
                {t("nav.dashboard")}
              </NavLink>
              <NavLink to="/orders" className={linkClass}>
                {t("nav.orders")}
              </NavLink>
              <NavLink to="/create" className={linkClass}>
                {t("nav.createOrder")}
              </NavLink>
              <NavLink to="/import" className={linkClass}>
                {t("nav.import")}
              </NavLink>
              <NavLink to="/map" className={linkClass}>
                {t("nav.map")}
              </NavLink>
            </nav>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className={isMapPage ? "" : "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"}>
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/90 backdrop-blur-lg md:hidden z-30">
        <div className="flex justify-around py-2">
          <NavLink to="/" className={linkClass} end>
            {t("nav.dashboard")}
          </NavLink>
          <NavLink to="/orders" className={linkClass}>
            {t("nav.orders")}
          </NavLink>
          <NavLink to="/create" className={linkClass}>
            +
          </NavLink>
          <NavLink to="/import" className={linkClass}>
            {t("nav.import")}
          </NavLink>
          <NavLink to="/map" className={linkClass}>
            🗺
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
