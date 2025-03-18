// User preferences management for poker game

// Default user preferences
export const DEFAULT_PREFERENCES = {
  soundEnabled: true,
  soundVolume: 70,
  chatEnabled: true,
  showHandHistory: true,
  showSpectators: true,
  autoFoldWhenAway: true,
  confirmActions: true,
  theme: "system", // "light", "dark", or "system"
  tableBackground: "green", // "green", "blue", "red", "purple"
  cardStyle: "classic", // "classic", "modern", "minimal"
}

// Storage key for preferences
const STORAGE_KEY = "poker_user_preferences"

// Load preferences from localStorage
export function loadUserPreferences() {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES
  }

  try {
    const savedPrefs = localStorage.getItem(STORAGE_KEY)
    if (!savedPrefs) {
      return DEFAULT_PREFERENCES
    }

    const parsedPrefs = JSON.parse(savedPrefs)
    return { ...DEFAULT_PREFERENCES, ...parsedPrefs }
  } catch (error) {
    console.error("Error loading user preferences:", error)
    return DEFAULT_PREFERENCES
  }
}

// Save preferences to localStorage
export function saveUserPreferences(preferences: Partial<typeof DEFAULT_PREFERENCES>) {
  if (typeof window === "undefined") {
    return
  }

  try {
    const currentPrefs = loadUserPreferences()
    const updatedPrefs = { ...currentPrefs, ...preferences }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPrefs))
    return updatedPrefs
  } catch (error) {
    console.error("Error saving user preferences:", error)
  }
}

// Save a single preference
export function savePreference<K extends keyof typeof DEFAULT_PREFERENCES>(
  key: K,
  value: (typeof DEFAULT_PREFERENCES)[K],
) {
  const prefs = loadUserPreferences()
  prefs[key] = value
  return saveUserPreferences(prefs)
}

// Reset preferences to defaults
export function resetUserPreferences() {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES))
  return DEFAULT_PREFERENCES
}

// Apply theme preference
export function applyThemePreference(theme: string) {
  if (typeof window === "undefined") {
    return
  }

  const root = document.documentElement

  // Remove existing theme classes
  root.classList.remove("light", "dark")

  if (theme === "system") {
    // Check system preference
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    root.classList.add(systemPrefersDark ? "dark" : "light")
  } else {
    // Apply specified theme
    root.classList.add(theme)
  }
}

// Apply table background preference
export function getTableBackgroundClass(background: string) {
  switch (background) {
    case "blue":
      return "bg-blue-700 dark:bg-blue-900 border-blue-800 dark:border-blue-950"
    case "red":
      return "bg-red-700 dark:bg-red-900 border-red-800 dark:border-red-950"
    case "purple":
      return "bg-purple-700 dark:bg-purple-900 border-purple-800 dark:border-purple-950"
    case "green":
    default:
      return "bg-green-700 dark:bg-green-900 border-green-800 dark:border-green-950"
  }
}

