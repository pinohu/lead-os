"use client"

import { MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MapEmbedProps {
  latitude: number | null
  longitude: number | null
  businessName: string
  address?: string | null
}

export function MapEmbed({
  latitude,
  longitude,
  businessName,
  address,
}: MapEmbedProps) {
  if (latitude === null || longitude === null) {
    return null
  }

  const embedUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <iframe
          src={embedUrl}
          title={`Map showing location of ${businessName}`}
          width="100%"
          height={300}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="rounded-md border"
          style={{ border: 0 }}
          allowFullScreen
        />
        {address && (
          <p className="text-sm text-muted-foreground">{address}</p>
        )}
      </CardContent>
    </Card>
  )
}
