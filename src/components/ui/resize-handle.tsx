import { cn } from '@/lib/utils'

interface ResizeHandleProps {
  className?: string
  onMouseDown?: (e: React.MouseEvent) => void
  direction?: 'horizontal' | 'vertical'
}

export function ResizeHandle({ 
  className, 
  onMouseDown, 
  direction = 'vertical' 
}: ResizeHandleProps) {
  return (
    <div
      className={cn(
        'bg-border hover:bg-primary/50 transition-colors',
        direction === 'horizontal' 
          ? 'h-1 cursor-ns-resize' 
          : 'w-1 cursor-ew-resize',
        className
      )}
      onMouseDown={onMouseDown}
    />
  )
}
