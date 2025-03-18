import type React from "react"
import { ErrorBoundary } from "@/lib/error-boundary"

export default function TableLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}

