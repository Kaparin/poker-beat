import { cn } from "@/lib/utils"

interface DealerButtonProps {
  type: "dealer" | "small-blind" | "big-blind"
  className?: string
}

export function DealerButton({ type, className }: DealerButtonProps) {
  const label = {
    dealer: "D",
    "small-blind": "SB",
    "big-blind": "BB",
  }[type]

  const bgColor = {
    dealer: "bg-white text-black",
    "small-blind": "bg-blue-500 text-white",
    "big-blind": "bg-red-500 text-white",
  }[type]

  return (
    <div
      className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
        bgColor,
        "border border-gray-300 dark:border-gray-600",
        "shadow-sm",
        className,
      )}
    >
      {label}
    </div>
  )
}

