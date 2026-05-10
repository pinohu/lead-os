import Script from "next/script";

const ERIE_PRO_CONVERTBOX_UUID = "d2c3d694-a219-4659-a17f-93165afe8ba0";
const convertBoxUuid = process.env.NEXT_PUBLIC_CONVERTBOX_UUID || ERIE_PRO_CONVERTBOX_UUID;

export function ConvertBoxLoader() {
  if (!convertBoxUuid) return null;

  return (
    <Script
      id="app-convertbox-script"
      src="https://cdn.convertbox.com/convertbox/js/embed.js"
      strategy="afterInteractive"
      data-uuid={convertBoxUuid}
    />
  );
}
