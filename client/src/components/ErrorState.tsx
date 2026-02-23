import { useTranslation } from "react-i18next";

interface Props {
  error: Error;
  onRetry?: () => void;
}

export default function ErrorState({ error, onRetry }: Props) {
  const { t } = useTranslation();

  return (
    <div className="card flex flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-red-600">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{t("common.error")}</h3>
        <p className="mt-1 text-sm text-gray-500">{error.message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}
