import { useTranslation } from "react-i18next";

function UkraineFlag({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className} aria-label="Українська">
      <g fillRule="evenodd" strokeWidth="1pt">
        <path fill="#0057b8" d="M0 0h640v240H0z" />
        <path fill="#ffd700" d="M0 240h640v240H0z" />
      </g>
    </svg>
  );
}

function USFlag({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className} aria-label="English">
      <g fillRule="evenodd">
        <g strokeWidth="1pt">
          <path
            fill="#bd3d44"
            d="M0 0h640v37h-640zm0 74h640v37h-640zm0 148h640v37h-640zm0 148h640v37h-640zm0-222h640v37h-640zm0 148h640v37h-640zm0 148h640v37h-640z"
          />
          <path
            fill="#fff"
            d="M0 37h640v37h-640zm0 148h640v37h-640zm0 148h640v37h-640zm0-222h640v37h-640zm0 148h640v37h-640zm0 148h640v37h-640z"
          />
        </g>
        <path fill="#192f5d" d="M0 0h256v259H0z" />
      </g>
    </svg>
  );
}

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggle = () => {
    const next = i18n.language === "en" ? "uk" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  const isEn = i18n.language === "en";

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:shadow"
      title={isEn ? "Змінити на українську" : "Switch to English"}
    >
      <div className="h-5 w-5 overflow-hidden rounded-sm shadow-sm">
        {isEn ? <USFlag /> : <UkraineFlag />}
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3 text-gray-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
      <div className="h-5 w-5 overflow-hidden rounded-sm shadow-sm opacity-40">
        {isEn ? <UkraineFlag /> : <USFlag />}
      </div>
    </button>
  );
}
