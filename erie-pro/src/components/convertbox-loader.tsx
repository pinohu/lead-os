import Script from "next/script";

const convertBoxUuid = process.env.NEXT_PUBLIC_CONVERTBOX_UUID;

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
