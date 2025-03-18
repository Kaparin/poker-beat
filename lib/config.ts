// Security-related configuration
export const security = {
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expiresIn: "1h",
    refreshExpiresIn: "7d",
    audience: process.env.JWT_AUDIENCE || "poker-beat-app",
    issuer: process.env.JWT_ISSUER || "poker-beat-auth",
  },

  // Rate limiting configuration
  rateLimit: {
    // General API rate limit
    api: {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
    },

    // Authentication rate limit
    auth: {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
    },

    // Withdrawal rate limit
    withdrawal: {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
    },
  },

  // Password hashing configuration
  passwordHashing: {
    iterations: 10000,
    keylen: 64,
    digest: "sha512",
  },

  // Content Security Policy
  csp: "default-src 'self'; script-src 'self' https://telegram.org; connect-src 'self' wss:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';",

  // CORS configuration
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },

  // Cookie configuration
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}

// Game-related configuration
export const game = {
  // Minimum and maximum players per table
  minPlayers: 2,
  maxPlayers: 9,

  // Default blinds
  defaultSmallBlind: 5,
  defaultBigBlind: 10,

  // Default buy-in limits
  defaultMinBuyIn: 200,
  defaultMaxBuyIn: 1000,

  // Turn time limit in seconds
  turnTimeLimit: 30,

  // Disconnect grace period in seconds
  disconnectGracePeriod: 30,
}

// Wallet-related configuration
export const wallet = {
  // TON to chips conversion rate
  tonToChipsRate: 100, // 1 TON = 100 chips

  // Withdrawal fee in TON
  withdrawalFee: 0.01,

  // Minimum deposit in TON
  minDeposit: 0.1,

  // Minimum withdrawal in chips
  minWithdrawal: 10,

  // Maximum withdrawals per day
  maxWithdrawalsPerDay: 3,
}

