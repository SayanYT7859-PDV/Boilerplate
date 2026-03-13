import { cn } from '@/lib/utils'

function Badge({ className, ...props }) {
  return (
    <span
      data-slot="badge"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-1 text-xs font-semibold tracking-[0.1em] uppercase',
        'bg-primary text-primary-foreground',
        className,
      )}
      {...props}
    />
  )
}

export { Badge }