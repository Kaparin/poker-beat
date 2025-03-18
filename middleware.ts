import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { withRouteTracking } from "./lib/route-analyzer"

// Пути, которые не требуют аутентификации
const publicPaths = ["/", "/login", "/api/auth/telegram", "/api/tables", "/api/admin/auth/login"]

// Пути, которые требуют административных прав
const adminPaths = ["/admin", "/api/admin"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Отслеживаем доступ к маршрутам
  return withRouteTracking(() => {
    // Проверяем, является ли путь публичным
    if (publicPaths.some((path) => pathname.startsWith(path) || pathname === path)) {
      return NextResponse.next()
    }

    // Получаем токен из заголовка Authorization или из cookie
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1] || request.cookies.get("token")?.value

    // Если токен отсутствует, перенаправляем на страницу входа
    if (!token) {
      // Если это API-запрос, возвращаем ошибку 401
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ message: "Не авторизован" }, { status: 401 })
      }

      // Для обычных страниц перенаправляем на страницу входа
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", encodeURI(request.url))
      return NextResponse.redirect(url)
    }

    try {
      // Проверяем токен
      const secret = new TextEncoder().encode(process.env.JWT_SECRET)
      const { payload } = await jwtVerify(token, secret, {
        audience: process.env.JWT_AUDIENCE,
        issuer: process.env.JWT_ISSUER,
      })

      // Проверяем, имеет ли пользователь доступ к административным путям
      if (adminPaths.some((path) => pathname.startsWith(path)) && !payload.isAdmin) {
        // Если это API-запрос, возвращаем ошибку 403
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 })
        }

        // Для обычных страниц перенаправляем на главную страницу
        return NextResponse.redirect(new URL("/", request.url))
      }

      // Пользователь авторизован, продолжаем выполнение запроса
      return NextResponse.next()
    } catch (error) {
      // Если токен недействителен, перенаправляем на страницу входа
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ message: "Недействительный токен" }, { status: 401 })
      }

      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", encodeURI(request.url))
      return NextResponse.redirect(url)
    }
  })(request)
}

export const config = {
  matcher: [
    // Защищаем все пути, кроме статических файлов и публичных путей
    "/((?!_next/static|_next/image|favicon.ico).*)",
    // Отслеживаем все API маршруты
    "/api/:path*",
  ],
}

