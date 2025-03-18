export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          telegram_id: string | null
          username: string | null
          first_name: string | null
          last_name: string | null
          photo_url: string | null
          created_at: string
          updated_at: string
          is_banned: boolean
          ban_reason: string | null
          is_admin: boolean
        }
        Insert: {
          id?: string
          telegram_id?: string | null
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
          is_banned?: boolean
          ban_reason?: string | null
          is_admin?: boolean
        }
        Update: {
          id?: string
          telegram_id?: string | null
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
          is_banned?: boolean
          ban_reason?: string | null
          is_admin?: boolean
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: string
          status: string
          created_at: string
          updated_at: string
          reference_id: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: string
          status: string
          created_at?: string
          updated_at?: string
          reference_id?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: string
          status?: string
          created_at?: string
          updated_at?: string
          reference_id?: string | null
          metadata?: Json | null
        }
      }
      tables: {
        Row: {
          id: string
          name: string
          game_type: string
          stakes: string
          max_players: number
          min_buy_in: number
          max_buy_in: number
          is_private: boolean
          password: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          game_type: string
          stakes: string
          max_players: number
          min_buy_in: number
          max_buy_in: number
          is_private?: boolean
          password?: string | null
          status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          game_type?: string
          stakes?: string
          max_players?: number
          min_buy_in?: number
          max_buy_in?: number
          is_private?: boolean
          password?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      table_players: {
        Row: {
          id: string
          table_id: string
          user_id: string
          seat_number: number
          stack: number
          is_sitting_out: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          table_id: string
          user_id: string
          seat_number: number
          stack: number
          is_sitting_out?: boolean
          joined_at?: string
        }
        Update: {
          id?: string
          table_id?: string
          user_id?: string
          seat_number?: number
          stack?: number
          is_sitting_out?: boolean
          joined_at?: string
        }
      }
      hands: {
        Row: {
          id: string
          table_id: string
          hand_number: string
          start_time: string
          end_time: string | null
          community_cards: string[] | null
          pot: number
          status: string
          winners: Json | null
        }
        Insert: {
          id?: string
          table_id: string
          hand_number: string
          start_time?: string
          end_time?: string | null
          community_cards?: string[] | null
          pot?: number
          status: string
          winners?: Json | null
        }
        Update: {
          id?: string
          table_id?: string
          hand_number?: string
          start_time?: string
          end_time?: string | null
          community_cards?: string[] | null
          pot?: number
          status?: string
          winners?: Json | null
        }
      }
      hand_actions: {
        Row: {
          id: string
          hand_id: string
          user_id: string
          action_type: string
          amount: number | null
          created_at: string
          street: string
        }
        Insert: {
          id?: string
          hand_id: string
          user_id: string
          action_type: string
          amount?: number | null
          created_at?: string
          street: string
        }
        Update: {
          id?: string
          hand_id?: string
          user_id?: string
          action_type?: string
          amount?: number | null
          created_at?: string
          street?: string
        }
      }
      player_statistics: {
        Row: {
          id: string
          user_id: string
          hands_played: number
          hands_won: number
          total_winnings: number
          total_losses: number
          biggest_pot: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          hands_played?: number
          hands_won?: number
          total_winnings?: number
          total_losses?: number
          biggest_pot?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          hands_played?: number
          hands_won?: number
          total_winnings?: number
          total_losses?: number
          biggest_pot?: number
          updated_at?: string
        }
      }
      promo_codes: {
        Row: {
          id: string
          code: string
          discount_percent: number | null
          bonus_amount: number | null
          max_uses: number | null
          current_uses: number
          expires_at: string | null
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          code: string
          discount_percent?: number | null
          bonus_amount?: number | null
          max_uses?: number | null
          current_uses?: number
          expires_at?: string | null
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          code?: string
          discount_percent?: number | null
          bonus_amount?: number | null
          max_uses?: number | null
          current_uses?: number
          expires_at?: string | null
          created_at?: string
          is_active?: boolean
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          created_at: string
          bonus_paid: boolean
          bonus_amount: number | null
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          created_at?: string
          bonus_paid?: boolean
          bonus_amount?: number | null
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_id?: string
          created_at?: string
          bonus_paid?: boolean
          bonus_amount?: number | null
        }
      }
      treasury_pool: {
        Row: {
          id: string
          balance: number
          rake_percentage: number
          updated_at: string
        }
        Insert: {
          id?: string
          balance?: number
          rake_percentage?: number
          updated_at?: string
        }
        Update: {
          id?: string
          balance?: number
          rake_percentage?: number
          updated_at?: string
        }
      }
      jackpots: {
        Row: {
          id: string
          name: string
          current_amount: number
          trigger_condition: string
          contribution_percentage: number
          last_won_at: string | null
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          current_amount?: number
          trigger_condition: string
          contribution_percentage?: number
          last_won_at?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          current_amount?: number
          trigger_condition?: string
          contribution_percentage?: number
          last_won_at?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
      }
      security_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          metadata?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

