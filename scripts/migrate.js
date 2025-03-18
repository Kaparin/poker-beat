// Скрипт для миграции базы данных
import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

// Получаем текущую директорию
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Инициализация Supabase клиента
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Ошибка: Переменные окружения SUPABASE_URL и SUPABASE_SERVICE_KEY должны быть установлены")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Путь к файлу с SQL-скриптом
const schemaPath = path.join(__dirname, "..", "db", "schema.sql")

// Проверяем существование файла
if (!fs.existsSync(schemaPath)) {
  console.error(`Ошибка: Файл ${schemaPath} не найден`)
  process.exit(1)
}

// Читаем SQL-скрипт
const schemaSql = fs.readFileSync(schemaPath, "utf8")

// Выполняем SQL-скрипт
async function runMigration() {
  try {
    console.log("Запуск миграции базы данных...")

    // Выполняем SQL-скрипт
    const { error } = await supabase.rpc("exec_sql", { sql: schemaSql })

    if (error) {
      console.error("Ошибка выполнения SQL-скрипта:", error)
      process.exit(1)
    }

    console.log("Миграция успешно завершена")
  } catch (error) {
    console.error("Ошибка миграции:", error)
    process.exit(1)
  }
}

runMigration()

