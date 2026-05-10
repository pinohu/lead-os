"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { convertBoxServiceMap } from "@/lib/convertbox-service-map";

declare global {
  interface Window {
    erieProConvertBox?: {
      serviceSlug: string | null;
      serviceLabel: string | null;
      pageType: string;
      family: string | null;
      boxId: number | null;
      countyFocus: string;
      source: "erie.pro";
    };
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function normalizePath(pathname: string) {
  return pathname.split("?")[0].replace(/^\/+|\/+$/g, "");
}

function getPageContext(pathname: string) {
  const [first = "", second = ""] = normalizePath(pathname).split("/");
  const entry = convertBoxServiceMap[first as keyof typeof convertBoxServiceMap];

  if (!entry) {
    return {
      serviceSlug: null,
      serviceLabel: null,
      pageType: first || "home",
      family: null,
      boxId: null,
    };
  }

  return {
    serviceSlug: entry.serviceSlug,
    serviceLabel: entry.serviceLabel,
    pageType: second || "core",
    family: entry.family,
    boxId: entry.boxId,
  };
}

export function ConvertBoxPageContext() {
  const pathname = usePathname();

  useEffect(() => {
    const context = {
      ...getPageContext(pathname),
      countyFocus: "Erie County",
      source: "erie.pro" as const,
    };

    window.erieProConvertBox = context;
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({
      event: "erie_pro_convertbox_context",
      ...context,
    });

    document.documentElement.dataset.epCountyFocus = "Erie County";
    if (context.serviceSlug) {
      document.documentElement.dataset.epServiceSlug = context.serviceSlug;
      document.documentElement.dataset.epServiceFamily = context.family ?? "";
      document.documentElement.dataset.epConvertboxId = String(context.boxId ?? "");
    } else {
      delete document.documentElement.dataset.epServiceSlug;
      delete document.documentElement.dataset.epServiceFamily;
      delete document.documentElement.dataset.epConvertboxId;
    }
  }, [pathname]);

  return null;
}
