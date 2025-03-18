"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { ThemeProviderProps } from "next-themes"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)

  // Предотвращаем мерцание при гидратации
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export const ThemeContext = createContext({
  theme: "light",
  setTheme: (_theme: string) => {},
})

export const useTheme = () => useContext(ThemeContext)

