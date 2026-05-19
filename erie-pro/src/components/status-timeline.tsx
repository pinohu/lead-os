interface StatusTimelineItem {
  status: string
  message: string | null
  at: string
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ")
}

export function StatusTimeline({ items }: { items: StatusTimelineItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No status updates yet.</p>
  }

  return (
    <ol className="relative border-l border-border pl-6 space-y-6">
      {items.map((item, index) => (
        <li key={`${item.at}-${index}`} className="relative">
          <span
            className="absolute -left-[1.625rem] top-1 flex h-3 w-3 rounded-full bg-primary ring-4 ring-background"
            aria-hidden
          />
          <p className="text-sm font-semibold capitalize">{formatStatus(item.status)}</p>
          {item.message && <p className="text-sm text-muted-foreground mt-0.5">{item.message}</p>}
          <time className="text-xs text-muted-foreground mt-1 block" dateTime={item.at}>
            {new Date(item.at).toLocaleString()}
          </time>
        </li>
      ))}
    </ol>
  )
}
