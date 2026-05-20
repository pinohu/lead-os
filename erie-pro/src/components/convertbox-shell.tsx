"use client"

import { usePathname } from "next/navigation"
import { shouldLoadConvertBox } from "@/lib/convertbox-placement-policy"
import { ConvertBoxEventTracker } from "@/components/convertbox-event-tracker"
import { ConvertBoxLoader } from "@/components/convertbox-loader"
import { ConvertBoxPageContext } from "@/components/convertbox-page-context"

export function ConvertBoxShell() {
  const pathname = usePathname()
  if (!shouldLoadConvertBox(pathname)) return null

  return (
    <>
      <ConvertBoxLoader />
      <ConvertBoxPageContext />
      <ConvertBoxEventTracker />
    </>
  )
}
