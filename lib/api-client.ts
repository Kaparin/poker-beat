/**
 * Клиент для работы с API
 * Централизованная точка для всех API-запросов
 */

import { createClient } from "@supabase/supabase-js"

// Инициализация Supabase клиента
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Типы для API-запросов
export type ApiResponse<T> = {
  data: T | null
  error: string | null
}

// Базовый класс для API-клиентов
export class BaseApiClient {
  protected async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.message || "Ошибка при выполнении запроса" }
      }

      const data = await response.json()
      return { data, error: null }
    } catch (error) {
      console.error("API error:", error)
      return { data: null, error: "Ошибка при выполнении запроса" }
    }
  }

  protected async post<T, D>(url: string, data: D): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.message || "Ошибка при выполнении запроса" }
      }

      const responseData = await response.json()
      return { data: responseData, error: null }
    } catch (error) {
      console.error("API error:", error)
      return { data: null, error: "Ошибка при выполнении запроса" }
    }
  }

  protected async put<T, D>(url: string, data: D): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.message || "Ошибка при выполнении запроса" }
      }

      const responseData = await response.json()
      return { data: responseData, error: null }
    } catch (error) {
      console.error("API error:", error)
      return { data: null, error: "Ошибка при выполнении запроса" }
    }
  }

  protected async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.message || "Ошибка при выполнении запроса" }
      }

      const data = await response.json()
      return { data, error: null }
    } catch (error) {
      console.error("API error:", error)
      return { data: null, error: "Ошибка при выполнении запроса" }
    }
  }
}

// Клиент для работы с пользователями
export class UsersApiClient extends BaseApiClient {
  async getUsers(params: { page?: number; limit?: number; status?: string; search?: string }) {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append("page", params.page.toString())
    if (params.limit) queryParams.append("limit", params.limit.toString())
    if (params.status) queryParams.append("status", params.status)
    if (params.search) queryParams.append("search", params.search)

    const url = `/api/admin/users?${queryParams.toString()}`
    return this.get(url)
  }

  async getUserById(id: string) {
    return this.get(`/api/admin/users/${id}`)
  }

  async updateUser(id: string, data: any) {
    return this.put(`/api/admin/users/${id}`, data)
  }

  async banUser(id: string) {
    return this.post(`/api/admin/users/${id}/ban`, {})
  }

  async unbanUser(id: string) {
    return this.post(`/api/admin/users/${id}/unban`, {})
  }
}

// Клиент для работы с играми
export class GamesApiClient extends BaseApiClient {
  async getGames(params: { page?: number; limit?: number; type?: string }) {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append("page", params.page.toString())
    if (params.limit) queryParams.append("limit", params.limit.toString())
    if (params.type) queryParams.append("type", params.type)

    const url = `/api/admin/games?${queryParams.toString()}`
    return this.get(url)
  }

  async getGameById(id: string) {
    return this.get(`/api/admin/games/${id}`)
  }
}

// Клиент для работы с транзакциями
export class TransactionsApiClient extends BaseApiClient {
  async getTransactions(params: { page?: number; limit?: number; type?: string; userId?: string }) {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append("page", params.page.toString())
    if (params.limit) queryParams.append("limit", params.limit.toString())
    if (params.type) queryParams.append("type", params.type)
    if (params.userId) queryParams.append("userId", params.userId)

    const url = `/api/admin/transactions?${queryParams.toString()}`
    return this.get(url)
  }

  async getTransactionById(id: string) {
    return this.get(`/api/admin/transactions/${id}`)
  }
}

// Клиент для работы с Treasury Pool
export class TreasuryApiClient extends BaseApiClient {
  async getTreasuryData() {
    return this.get("/api/admin/treasury")
  }
}

// Клиент для работы с джекпотом
export class JackpotApiClient extends BaseApiClient {
  async getJackpotData() {
    return this.get("/api/admin/jackpot")
  }
}

// Клиент для работы с дашбордом
export class DashboardApiClient extends BaseApiClient {
  async getDashboardData() {
    return this.get("/api/admin/dashboard")
  }

  async getRecentUsers() {
    return this.get("/api/admin/dashboard/recent-users")
  }

  async getRecentGames() {
    return this.get("/api/admin/dashboard/recent-games")
  }

  async getRecentTransactions() {
    return this.get("/api/admin/dashboard/recent-transactions")
  }

  async getActiveTablesData() {
    return this.get("/api/admin/dashboard/active-tables")
  }

  async getActiveTournamentsData() {
    return this.get("/api/admin/dashboard/active-tournaments")
  }

  async getUserStatsData() {
    return this.get("/api/admin/dashboard/user-stats")
  }

  async getFinancialStatsData() {
    return this.get("/api/admin/dashboard/financial-stats")
  }
}

// Экспорт экземпляров клиентов
export const usersApi = new UsersApiClient()
export const gamesApi = new GamesApiClient()
export const transactionsApi = new TransactionsApiClient()
export const treasuryApi = new TreasuryApiClient()
export const jackpotApi = new JackpotApiClient()
export const dashboardApi = new DashboardApiClient()

