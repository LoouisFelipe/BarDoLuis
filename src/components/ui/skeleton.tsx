import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'pulse' | 'shimmer'
}

function Skeleton({
  className,
  variant = 'pulse',
  ...props
}: SkeletonProps) {
  return (
    <>
      {variant === 'shimmer' && (
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}} />
      )}
      <div
        className={cn(
          "rounded-md bg-muted overflow-hidden relative",
          variant === 'pulse' && "animate-pulse",
          variant === 'shimmer' && "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          className
        )}
        {...props}
      />
    </>
  )
}

export { Skeleton }