export interface NavigationLink {
  path: string
  label: string
  expectedTitle?: string
  requiredElements?: string[]
}

export interface NavigationTestResult {
  link: NavigationLink
  status: "success" | "error" | "warning"
  errors: string[]
  warnings: string[]
  missingElements: string[]
}

export const mainNavigationLinks: NavigationLink[] = [
  {
    path: "/",
    label: "Главная",
    expectedTitle: "Poker Game",
    requiredElements: ['[data-testid="auth-button"]', '[data-testid="main-logo"]'],
  },
  {
    path: "/lobby",
    label: "Лобби",
    expectedTitle: "Лобби | Poker Game",
    requiredElements: ['[data-testid="tables-list"]', '[data-testid="filters"]'],
  },
  {
    path: "/profile",
    label: "Профиль",
    expectedTitle: "Профиль | Poker Game",
    requiredElements: ['[data-testid="user-info"]', '[data-testid="statistics"]'],
  },
  {
    path: "/wallet",
    label: "Кошелек",
    expectedTitle: "Кошелек | Poker Game",
    requiredElements: ['[data-testid="balance"]', '[data-testid="transactions"]'],
  },
  {
    path: "/tournaments",
    label: "Турниры",
    expectedTitle: "Турниры | Poker Game",
    requiredElements: ['[data-testid="tournaments-list"]'],
  },
  {
    path: "/achievements",
    label: "Достижения",
    expectedTitle: "Достижения | Poker Game",
    requiredElements: ['[data-testid="achievements-list"]'],
  },
  {
    path: "/friends",
    label: "Друзья",
    expectedTitle: "Друзья | Poker Game",
    requiredElements: ['[data-testid="friends-list"]'],
  },
  {
    path: "/admin",
    label: "Админ",
    expectedTitle: "Админ панель | Poker Game",
    requiredElements: ['[data-testid="admin-dashboard"]'],
  },
]

export async function testNavigation(links: NavigationLink[] = mainNavigationLinks): Promise<NavigationTestResult[]> {
  const results: NavigationTestResult[] = []

  for (const link of links) {
    try {
      const response = await fetch(link.path)
      const html = await response.text()

      const missingElements: string[] = []
      if (link.requiredElements) {
        // In a real implementation, we would parse the HTML and check for elements
        // Here we're just simulating the check
        for (const selector of link.requiredElements) {
          if (!html.includes(selector)) {
            missingElements.push(selector)
          }
        }
      }

      const titleMatch = html.match(/<title>(.*?)<\/title>/)
      const pageTitle = titleMatch ? titleMatch[1] : ""

      const warnings: string[] = []
      if (link.expectedTitle && pageTitle !== link.expectedTitle) {
        warnings.push(`Expected title "${link.expectedTitle}" but got "${pageTitle}"`)
      }

      results.push({
        link,
        status: missingElements.length > 0 ? "error" : warnings.length > 0 ? "warning" : "success",
        errors: missingElements.length > 0 ? [`Missing required elements: ${missingElements.join(", ")}`] : [],
        warnings,
        missingElements,
      })
    } catch (error) {
      results.push({
        link,
        status: "error",
        errors: [error instanceof Error ? error.message : "Unknown error"],
        warnings: [],
        missingElements: [],
      })
    }
  }

  return results
}

