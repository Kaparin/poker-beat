import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

if (!process.env.SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL environment variable")
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_KEY environment variable")
}

// Создаем клиент Supabase с сервисным ключом для серверных операций
export const supabaseAdmin = createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

// Создаем публичный клиент для клиентских операций
export const createSupabaseClient = (supabaseAccessToken?: string) => {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: {
      headers: supabaseAccessToken ? { Authorization: `Bearer ${supabaseAccessToken}` } : {},
    },
  })
}

