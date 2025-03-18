import { type NextRequest, NextResponse } from "next/server"
import { logSecurityEvent } from "./db-schema"

// Типы ошибок
export class AppError extends Error {
  statusCode: number
  code: string

  constructor(message: string, statusCode = 500, code = "internal_error") {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.name = "AppError"
  }
}

export class ValidationError extends AppError {
  fields: Record<string, string>

  constructor(message: string, fields: Record<string, string>) {
    super(message, 400, "validation_error")
    this.fields = fields
    this.name = "ValidationError"
  }
}

export class AuthError extends AppError {
  constructor(message = "Не авторизован") {
    super(message, 401, "unauthorized")
    this.name = "AuthError"
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Доступ запрещен") {
    super(message, 403, "forbidden")
    this.name = "ForbiddenError"
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Ресурс не найден") {
    super(message, 404, "not_found")
    this.name = "NotFoundError"
  }
}

// Middleware для обработки ошибок
export function withErrorHandler(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      return await handler(req)
    } catch (error) {
      console.error("API error:", error)

      // Логируем ошибку
      const ip = req.headers.get("x-forwarded-for") || "unknown"
      const userAgent = req.headers.get("user-agent") || "unknown"

      await logSecurityEvent({
        action: "api_error",
        ip_address: ip,
        user_agent: userAgent,
        details: {
          path: req.nextUrl.pathname,
          method: req.method,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      })

      // Форматируем ответ в зависимости от типа ошибки
      if (error instanceof AppError) {
        return NextResponse.json(
          {
            error: {
              message: error.message,
              code: error.code,
              ...(error instanceof ValidationError ? { fields: error.fields } : {}),
            },
          },
          { status: error.statusCode },
        )
      }

      // Для неизвестных ошибок возвращаем 500
      return NextResponse.json(
        {
          error: {
            message: "Внутренняя ошибка сервера",
            code: "internal_error",
          },
        },
        { status: 500 },
      )
    }
  }
}

// Функция для валидации данных запроса
export function validateRequest<T>(data: any, schema: Record<string, (value: any) => boolean | string>): T {
  const errors: Record<string, string> = {}

  for (const [field, validator] of Object.entries(schema)) {
    const result = validator(data[field])

    if (typeof result === "string") {
      errors[field] = result
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError("Ошибка валидации", errors)
  }

  return data as T
}

// Валидаторы
export const validators = {
  required: (value: any): boolean | string => {
    if (value === undefined || value === null || value === "") {
      return "Обязательное поле"
    }
    return true
  },

  string: (value: any): boolean | string => {
    if (value === undefined || value === null) {
      return true
    }
    if (typeof value !== "string") {
      return "Должно быть строкой"
    }
    return true
  },

  number: (value: any): boolean | string => {
    if (value === undefined || value === null) {
      return true
    }
    if (typeof value !== "number" || isNaN(value)) {
      return "Должно быть числом"
    }
    return true
  },

  boolean: (value: any): boolean | string => {
    if (value === undefined || value === null) {
      return true
    }
    if (typeof value !== "boolean") {
      return "Должно быть логическим значением"
    }
    return true
  },

  email: (value: any): boolean | string => {
    if (value === undefined || value === null || value === "") {
      return true
    }
    if (typeof value !== "string") {
      return "Должно быть строкой"
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return "Некорректный email"
    }
    return true
  },

  min:
    (min: number) =>
    (value: any): boolean | string => {
      if (value === undefined || value === null) {
        return true
      }
      if (typeof value !== "number") {
        return "Должно быть числом"
      }
      if (value < min) {
        return `Должно быть не меньше ${min}`
      }
      return true
    },

  max:
    (max: number) =>
    (value: any): boolean | string => {
      if (value === undefined || value === null) {
        return true
      }
      if (typeof value !== "number") {
        return "Должно быть числом"
      }
      if (value > max) {
        return `Должно быть не больше ${max}`
      }
      return true
    },

  minLength:
    (min: number) =>
    (value: any): boolean | string => {
      if (value === undefined || value === null || value === "") {
        return true
      }
      if (typeof value !== "string") {
        return "Должно быть строкой"
      }
      if (value.length < min) {
        return `Должно содержать не менее ${min} символов`
      }
      return true
    },

  maxLength:
    (max: number) =>
    (value: any): boolean | string => {
      if (value === undefined || value === null || value === "") {
        return true
      }
      if (typeof value !== "string") {
        return "Должно быть строкой"
      }
      if (value.length > max) {
        return `Должно содержать не более ${max} символов`
      }
      return true
    },

  pattern:
    (regex: RegExp, message: string) =>
    (value: any): boolean | string => {
      if (value === undefined || value === null || value === "") {
        return true
      }
      if (typeof value !== "string") {
        return "Должно быть строкой"
      }
      if (!regex.test(value)) {
        return message
      }
      return true
    },

  oneOf:
    (values: any[], message: string) =>
    (value: any): boolean | string => {
      if (value === undefined || value === null) {
        return true
      }
      if (!values.includes(value)) {
        return message
      }
      return true
    },
}

