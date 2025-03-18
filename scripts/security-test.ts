/**
 * Security Testing Script
 *
 * This script performs basic security tests against the API endpoints
 * to ensure proper authentication and authorization.
 *
 * Usage:
 * 1. Start the development server
 * 2. Run: npx ts-node scripts/security-test.ts
 */

import fetch from "node-fetch"
import chalk from "chalk"

const API_BASE_URL = "http://localhost:3000/api"
const WS_BASE_URL = "ws://localhost:3000/api/socket"

// Invalid token for testing
const INVALID_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5OTk5LCJ0ZWxlZ3JhbUlkIjo5OTk5OSwiaWF0IjoxNjE2MTYxNjE2LCJleHAiOjk5OTk5OTk5OTl9.invalid-signature"

async function runTests() {
  console.log(chalk.blue("🔒 Running Security Tests 🔒\n"))

  // Test authentication endpoints
  await testEndpoint("POST", "/auth", { initData: "invalid-data" }, "Authentication with invalid data", 401)

  // Test profile endpoints without authentication
  await testEndpoint("GET", "/profile", null, "Profile access without token", 401)
  await testEndpoint("PATCH", "/profile", { inGameName: "Hacker" }, "Profile update without token", 401)

  // Test wallet endpoints without authentication
  await testEndpoint("GET", "/wallet/balance", null, "Balance access without token", 401)
  await testEndpoint("POST", "/wallet/withdraw", { amount: 1000, address: "EQ123" }, "Withdrawal without token", 401)

  // Test with invalid token
  await testEndpoint("GET", "/profile", null, "Profile access with invalid token", 401, INVALID_TOKEN)

  // Test rate limiting
  console.log(chalk.yellow("\nTesting rate limiting..."))
  for (let i = 0; i < 12; i++) {
    const response = await testEndpoint("POST", "/auth", { initData: "invalid-data" }, `Auth request #${i + 1}`, null)
    if (response.status === 429) {
      console.log(chalk.green("✓ Rate limiting is working correctly"))
      break
    }
    if (i === 11) {
      console.log(chalk.red("✗ Rate limiting does not seem to be working"))
    }
  }

  // Test CORS
  console.log(chalk.yellow("\nTesting CORS headers..."))
  const corsResponse = await fetch(`${API_BASE_URL}/profile`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://malicious-site.com",
      "Access-Control-Request-Method": "GET",
    },
  })

  const allowOrigin = corsResponse.headers.get("access-control-allow-origin")
  if (!allowOrigin || allowOrigin === "*") {
    console.log(chalk.green("✓ CORS is properly restricted"))
  } else {
    console.log(chalk.red(`✗ CORS might be too permissive: ${allowOrigin}`))
  }

  console.log(chalk.blue("\n🔒 Security Tests Completed 🔒"))
}

async function testEndpoint(
  method: string,
  path: string,
  body: any | null,
  description: string,
  expectedStatus: number | null,
  token?: string,
) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (expectedStatus !== null) {
      if (response.status === expectedStatus) {
        console.log(chalk.green(`✓ ${description}: Got expected status ${expectedStatus}`))
      } else {
        console.log(chalk.red(`✗ ${description}: Expected status ${expectedStatus}, got ${response.status}`))
        try {
          const data = await response.json()
          console.log(chalk.gray("Response:", JSON.stringify(data, null, 2)))
        } catch (e) {
          // Ignore JSON parsing errors
        }
      }
    }

    return response
  } catch (error) {
    console.log(chalk.red(`✗ ${description}: Request failed`), error)
    return { status: 0 } as any
  }
}

runTests().catch(console.error)

