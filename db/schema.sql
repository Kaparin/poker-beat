-- Создание расширения для хеширования паролей
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  telegram_id TEXT UNIQUE,
  avatar_url TEXT,
  balance BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  password_hash TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned', 'suspended'))
);

-- Создание таблицы столов
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('texas_holdem', 'omaha', 'five_card_draw')),
  stakes TEXT NOT NULL,
  min_buy_in BIGINT NOT NULL,
  max_buy_in BIGINT NOT NULL,
  max_players INTEGER NOT NULL,
  current_players INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'full')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы транзакций
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'game_win', 'game_loss', 'bonus')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы журнала безопасности
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы промо-кодов
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value BIGINT NOT NULL,
  max_uses INTEGER NOT NULL,
  current_uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired'))
);

-- Создание таблицы рефералов
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  referred_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  reward BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);

-- Создание функции для получения статистики игр пользователя
CREATE OR REPLACE FUNCTION get_user_games_stats(user_id_param UUID)
RETURNS TABLE (
  total_games BIGINT,
  wins BIGINT,
  win_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH game_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE type IN ('game_win', 'game_loss')) AS total,
      COUNT(*) FILTER (WHERE type = 'game_win') AS wins
    FROM transactions
    WHERE user_id = user_id_param AND status = 'completed'
  )
  SELECT
    total,
    wins,
    CASE WHEN total > 0 THEN (wins::NUMERIC / total) * 100 ELSE 0 END
  FROM game_stats;
END;
$$ LANGUAGE plpgsql;

-- Создание функции для получения финансовой статистики пользователя
CREATE OR REPLACE FUNCTION get_user_financial_stats(user_id_param UUID)
RETURNS TABLE (
  total_deposits BIGINT,
  total_withdrawals BIGINT,
  profit_loss BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE type = 'deposit' AND status = 'completed'), 0) AS total_deposits,
    COALESCE(SUM(amount) FILTER (WHERE type = 'withdrawal' AND status = 'completed'), 0) AS total_withdrawals,
    COALESCE(SUM(CASE
      WHEN type = 'game_win' AND status = 'completed' THEN amount
      WHEN type = 'game_loss' AND status = 'completed' THEN -amount
      WHEN type = 'bonus' AND status = 'completed' THEN amount
      ELSE 0
    END), 0) AS profit_loss
  FROM transactions
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Создание администратора (замените 'admin_password' на желаемый пароль)
INSERT INTO users (username, is_admin, status, password_hash)
VALUES (
  'admin',
  TRUE,
  'active',
  crypt('admin_password', gen_salt('bf'))
)
ON CONFLICT (username) DO UPDATE
SET
  is_admin = TRUE,
  status = 'active',
  password_hash = crypt('admin_password', gen_salt('bf'));

