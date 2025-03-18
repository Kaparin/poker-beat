import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

// Пути, которые не требуют аутентификации
const publicPaths = ["/", "/login", "/api/auth/telegram", "/api/tables", "/api/admin/auth/login"]

// Пути, которые требуют административных прав
const adminPaths = ["/admin", "/api/admin"]

// Функция middleware
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Проверяем, является ли путь публичным
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Проверяем, является ли путь административным
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path))

  // Получаем токен из cookie
  const token = request.cookies.get("auth_token")?.value

  // Если токена нет, перенаправляем на страницу входа
  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  // Проверяем токен
  try {
    // Проверяем токен
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, {
      audience: process.env.JWT_AUDIENCE,
      issuer: process.env.JWT_ISSUER,
    })

    // Если путь административный, проверяем права администратора
    if (isAdminPath && !payload.is_admin) {
      return new NextResponse(JSON.stringify({ success: false, message: "Недостаточно прав" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      })
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Ошибка проверки токена:", error)

    // В случае ошибки перенаправляем на страницу входа
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }
}

// Конфигурация middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}

