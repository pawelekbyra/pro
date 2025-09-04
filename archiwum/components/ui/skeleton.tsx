import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md bg-white/10 flex items-center justify-center", className)}
      {...props}
    >
      <Loader2 className="h-8 w-8 text-white/20 animate-spin" />
    </div>
  )
}

export { Skeleton }
