"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"

interface PhotoGalleryDialogProps {
  /** Pre-resolved thumbnail URLs (400px) */
  thumbnailUrls: string[]
  /** Pre-resolved full-size URLs (800px) */
  fullUrls: string[]
  providerName: string
}

export function PhotoGalleryDialog({
  thumbnailUrls,
  fullUrls,
  providerName,
}: PhotoGalleryDialogProps) {
  const [open, setOpen] = useState(false)

  if (thumbnailUrls.length <= 1) return null

  const previewPhotos = thumbnailUrls.slice(1, 5)
  const remaining = thumbnailUrls.length - 5

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="mt-6 grid grid-cols-4 gap-2 rounded-lg overflow-hidden cursor-pointer group"
          aria-label={`View all ${thumbnailUrls.length} photos of ${providerName}`}
        >
          {previewPhotos.map((url, i) => (
            <div key={i} className="relative aspect-[4/3] overflow-hidden">
              <img
                src={url}
                alt={`${providerName} photo ${i + 2}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              {i === previewPhotos.length - 1 && remaining > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-semibold text-sm">
                  +{remaining} more
                </div>
              )}
            </div>
          ))}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-0">
        <DialogTitle className="sr-only">{providerName} Photos</DialogTitle>
        <Carousel className="w-full">
          <CarouselContent>
            {fullUrls.map((url, i) => (
              <CarouselItem key={i}>
                <div className="flex items-center justify-center p-2">
                  <img
                    src={url}
                    alt={`${providerName} photo ${i + 1}`}
                    className="max-h-[70vh] w-full rounded-md object-contain"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
        <p className="pb-3 text-center text-xs text-muted-foreground">
          {fullUrls.length} photos of {providerName}
        </p>
      </DialogContent>
    </Dialog>
  )
}
