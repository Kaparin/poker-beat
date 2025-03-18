-- Таблица пользователей
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id TEXT UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  is_admin BOOLEAN DEFAULT FALSE
);

-- Таблица кошельков
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(20, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Таблица транзакций
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(20, 2) NOT NULL,
  type TEXT NOT NULL, -- 'deposit', 'withdraw', 'game_win', 'game_loss', 'bonus'
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reference_id TEXT, -- для внешних транзакций
  metadata JSONB -- дополнительная информация
);

-- Таблица столов
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  game_type TEXT NOT NULL, -- 'texas_holdem', 'omaha', etc.
  stakes TEXT NOT NULL, -- '1/2', '2/5', etc.
  max_players INTEGER NOT NULL,
  min_buy_in DECIMAL(20, 2) NOT NULL,
  max_buy_in DECIMAL(20, 2) NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  password TEXT, -- для приватных столов
  status TEXT NOT NULL, -- 'active', 'inactive', 'full'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица игроков за столами
CREATE TABLE table_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL,
  stack DECIMAL(20, 2) NOT NULL,
  is_sitting_out BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(table_id, seat_number),
  UNIQUE(table_id, user_id)
);

-- Таблица раздач
CREATE TABLE hands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  hand_number TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  community_cards TEXT[], -- ['Ah', '2d', '3c', '4s', '5h']
  pot DECIMAL(20, 2) DEFAULT 0,
  status TEXT NOT NULL, -- 'active', 'completed'
  winners JSONB -- информация о победителях
);

-- Таблица действий в раздаче
CREATE TABLE hand_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hand_id UUID REFERENCES hands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'fold', 'check', 'call', 'bet', 'raise'
  amount DECIMAL(20, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  street TEXT NOT NULL -- 'preflop', 'flop', 'turn', 'river'
);

-- Таблица статистики игроков
CREATE TABLE player_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hands_played INTEGER DEFAULT 0,
  hands_won INTEGER DEFAULT 0,
  total_winnings DECIMAL(20, 2) DEFAULT 0,
  total_losses DECIMAL(20, 2) DEFAULT 0,
  biggest_pot DECIMAL(20, 2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Таблица для промо-кодов
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER,
  bonus_amount DECIMAL(20, 2),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Таблица для реферальной системы
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bonus_paid BOOLEAN DEFAULT FALSE,
  bonus_amount DECIMAL(20, 2),
  UNIQUE(referred_id)
);

-- Таблица для казначейского пула
CREATE TABLE treasury_pool (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  balance DECIMAL(20, 2) DEFAULT 0,
  rake_percentage DECIMAL(5, 2) DEFAULT 5.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица для джекпота
CREATE TABLE jackpots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  current_amount DECIMAL(20, 2) DEFAULT 0,
  trigger_condition TEXT NOT NULL, -- 'royal_flush', 'four_of_a_kind', etc.
  contribution_percentage DECIMAL(5, 2) DEFAULT 1.00,
  last_won_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Таблица для уведомлений
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'system', 'promotion', 'game', 'friend'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица для логов безопасности
CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

