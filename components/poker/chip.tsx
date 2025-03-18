import { cn } from "@/lib/utils"

interface ChipProps {
  value: number
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Chip({ value, size = "md", className }: ChipProps) {
  const chipColor = getChipColor(value)

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
  }[size]

  return (
    <div
      className={cn(
        sizeClasses,
        "rounded-full flex items-center justify-center font-bold text-white relative",
        chipColor,
        "border-2 border-white dark:border-gray-800",
        "shadow-md",
        className,
      )}
    >
      <div className="absolute inset-2 rounded-full border border-white/30 dark:border-black/30"></div>
      {size !== "sm" && <span>{value}</span>}
    </div>
  )
}

function getChipColor(value: number): string {
  if (value <= 5) return "bg-white text-gray-800"
  if (value <= 25) return "bg-red-600"
  if (value <= 100) return "bg-green-600"
  if (value <= 500) return "bg-blue-600"
  if (value <= 1000) return "bg-purple-600"
  return "bg-black"
}

