import fs from "fs"
import path from "path"

// Типы для анализа зависимостей
export type DependencyInfo = {
  name: string
  version: string
  type: "dependency" | "devDependency"
  usedIn: string[]
  size?: number
  license?: string
  vulnerabilities?: number
}

// Типы для анализа импортов
export type ImportInfo = {
  file: string
  imports: string[]
}

/**
 * Анализ зависимостей проекта
 */
export async function analyzeDependencies(projectDir = "./"): Promise<DependencyInfo[]> {
  // Читаем package.json
  const packageJsonPath = path.join(projectDir, "package.json")
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error("package.json не найден")
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
  const dependencies = packageJson.dependencies || {}
  const devDependencies = packageJson.devDependencies || {}

  // Анализируем импорты в файлах проекта
  const imports = await analyzeImports(projectDir)

  // Формируем информацию о зависимостях
  const dependencyInfos: DependencyInfo[] = []

  // Обрабатываем основные зависимости
  for (const [name, version] of Object.entries(dependencies)) {
    const usedIn = findUsageInImports(name, imports)

    dependencyInfos.push({
      name,
      version: version as string,
      type: "dependency",
      usedIn,
    })
  }

  // Обрабатываем dev-зависимости
  for (const [name, version] of Object.entries(devDependencies)) {
    const usedIn = findUsageInImports(name, imports)

    dependencyInfos.push({
      name,
      version: version as string,
      type: "devDependency",
      usedIn,
    })
  }

  return dependencyInfos
}

/**
 * Анализ импортов в файлах проекта
 */
async function analyzeImports(projectDir: string): Promise<ImportInfo[]> {
  const imports: ImportInfo[] = []

  // Рекурсивная функция для сканирования директорий
  async function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      // Пропускаем node_modules и .git
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules" && entry.name !== ".git") {
          await scanDir(fullPath)
        }
      } else if (
        entry.name.endsWith(".js") ||
        entry.name.endsWith(".jsx") ||
        entry.name.endsWith(".ts") ||
        entry.name.endsWith(".tsx")
      ) {
        // Анализируем файл
        const fileImports = extractImports(fullPath)
        if (fileImports.length > 0) {
          imports.push({
            file: fullPath.replace(/\\/g, "/").replace(projectDir, ""),
            imports: fileImports,
          })
        }
      }
    }
  }

  await scanDir(projectDir)
  return imports
}

/**
 * Извлечение импортов из файла
 */
function extractImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8")
  const imports: string[] = []

  // Регулярное выражение для поиска импортов
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+[^,]+|[^,{}\s*]+)\s*,?\s*)*\s*from\s+['"]([^'"]+)['"]/g

  let match
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1]

    // Исключаем относительные импорты и импорты из приложения
    if (!importPath.startsWith("./") && !importPath.startsWith("../") && !importPath.startsWith("@/")) {
      // Извлекаем имя пакета (для импортов вида 'package/subpath')
      const packageName = importPath.split("/")[0]
      if (!imports.includes(packageName)) {
        imports.push(packageName)
      }
    }
  }

  // Регулярное выражение для поиска require
  const requireRegex = /require\s*$$\s*['"]([^'"]+)['"]\s*$$/g

  while ((match = requireRegex.exec(content)) !== null) {
    const importPath = match[1]

    // Исключаем относительные импорты и импорты из приложения
    if (!importPath.startsWith("./") && !importPath.startsWith("../") && !importPath.startsWith("@/")) {
      // Извлекаем имя пакета (для импортов вида 'package/subpath')
      const packageName = importPath.split("/")[0]
      if (!imports.includes(packageName)) {
        imports.push(packageName)
      }
    }
  }

  return imports
}

/**
 * Поиск использования пакета в импортах
 */
function findUsageInImports(packageName: string, imports: ImportInfo[]): string[] {
  return imports.filter((info) => info.imports.includes(packageName)).map((info) => info.file)
}

/**
 * Поиск неиспользуемых зависимостей
 */
export function findUnusedDependencies(dependencies: DependencyInfo[]): DependencyInfo[] {
  return dependencies.filter((dep) => dep.usedIn.length === 0)
}

/**
 * Поиск наиболее используемых зависимостей
 */
export function findMostUsedDependencies(dependencies: DependencyInfo[], limit = 10): DependencyInfo[] {
  return [...dependencies].sort((a, b) => b.usedIn.length - a.usedIn.length).slice(0, limit)
}

