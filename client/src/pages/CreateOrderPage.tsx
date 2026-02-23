import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCreateOrder } from "../hooks/useOrders";
import { formatCurrency, formatPercent } from "../utils/format";
import type { Order } from "../api/types";

interface FormValues {
  latitude: string;
  longitude: string;
  subtotal: string;
  timestamp: string;
}

export default function CreateOrderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mutation = useCreateOrder();
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      latitude: "",
      longitude: "",
      subtotal: "",
      timestamp: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(
      {
        latitude: parseFloat(values.latitude),
        longitude: parseFloat(values.longitude),
        subtotal: parseFloat(values.subtotal),
        timestamp: values.timestamp || undefined,
      },
      { onSuccess: (order) => setCreatedOrder(order) }
    );
  };

  if (createdOrder) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="card p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-7 w-7 text-green-600"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {t("createOrder.successTitle")}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {t("createOrder.successMessage")}
          </p>

          <div className="mt-6 space-y-3 rounded-lg bg-gray-50 p-4 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("orders.county")}</span>
              <span className="font-medium">
                {createdOrder.jurisdictions?.county || "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("orders.subtotal")}</span>
              <span className="font-medium">
                {formatCurrency(createdOrder.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("orders.taxRate")}</span>
              <span className="font-medium">
                {formatPercent(createdOrder.compositeTaxRate)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("orders.taxAmount")}</span>
              <span className="font-medium">
                {formatCurrency(createdOrder.taxAmount)}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-sm">
              <span className="font-semibold">{t("orders.total")}</span>
              <span className="text-lg font-bold text-brand-700">
                {formatCurrency(createdOrder.totalAmount)}
              </span>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => navigate("/orders")}
              className="btn-secondary flex-1"
            >
              {t("nav.orders")}
            </button>
            <button
              onClick={() => {
                setCreatedOrder(null);
                mutation.reset();
              }}
              className="btn-primary flex-1"
            >
              {t("createOrder.createAnother")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t("createOrder.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("createOrder.subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t("orders.latitude")}
            </label>
            <input
              {...register("latitude", {
                required: t("createOrder.validationErrors.latRequired"),
                validate: (v) => {
                  const n = parseFloat(v);
                  if (isNaN(n))
                    return t("createOrder.validationErrors.latRequired");
                  if (n < -90 || n > 90)
                    return t("createOrder.validationErrors.latRange");
                  return true;
                },
              })}
              type="text"
              inputMode="decimal"
              placeholder={t("createOrder.latitudePlaceholder")}
              className="input-field"
            />
            {errors.latitude && (
              <p className="mt-1 text-xs text-red-500">
                {errors.latitude.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t("orders.longitude")}
            </label>
            <input
              {...register("longitude", {
                required: t("createOrder.validationErrors.lonRequired"),
                validate: (v) => {
                  const n = parseFloat(v);
                  if (isNaN(n))
                    return t("createOrder.validationErrors.lonRequired");
                  if (n < -180 || n > 180)
                    return t("createOrder.validationErrors.lonRange");
                  return true;
                },
              })}
              type="text"
              inputMode="decimal"
              placeholder={t("createOrder.longitudePlaceholder")}
              className="input-field"
            />
            {errors.longitude && (
              <p className="mt-1 text-xs text-red-500">
                {errors.longitude.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t("orders.subtotal")}
          </label>
          <input
            {...register("subtotal", {
              required: t("createOrder.validationErrors.subtotalRequired"),
              validate: (v) => {
                const n = parseFloat(v);
                if (isNaN(n))
                  return t("createOrder.validationErrors.subtotalRequired");
                if (n <= 0)
                  return t("createOrder.validationErrors.subtotalPositive");
                return true;
              },
            })}
            type="text"
            inputMode="decimal"
            placeholder={t("createOrder.subtotalPlaceholder")}
            className="input-field"
          />
          {errors.subtotal && (
            <p className="mt-1 text-xs text-red-500">
              {errors.subtotal.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t("createOrder.timestampLabel")}
          </label>
          <input
            {...register("timestamp")}
            type="datetime-local"
            className="input-field"
          />
        </div>

        {mutation.isError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {(mutation.error as Error).message}
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary w-full"
        >
          {mutation.isPending
            ? t("createOrder.creating")
            : t("createOrder.create")}
        </button>
      </form>
    </div>
  );
}
